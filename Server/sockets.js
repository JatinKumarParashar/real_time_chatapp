const User = require("./models/user");
const Message = require("./models/message");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Generate jsonwebtoken for user
function generateAccessToken(id) {
  return jwt.sign(
    {
      user: id,
    },
    process.env.SCREATE_KEY_FOR_TOKEN
  );
}

// New user signup
exports.newUserSignup = async (io, socket, users) => {
  const signupHandler = async (obj) => {
    try {
      const username = obj?.username?.trim();
      const email = obj?.email?.trim().toLowerCase();
      const password = obj?.password;

      if (!username || !email || typeof password !== "string" || !password) {
        io.to(socket.id).emit("error", "Please enter a username, email, and password.");
        return;
      }

      const hash = await bcrypt.hash(password, 10);
      await User.create({
        username,
        email,
        password: hash,
      });
      io.to(socket.id).emit("signupSuccess", "signup Successfully");
    } catch (err) {
      const isDuplicateEmail = err.name === "SequelizeUniqueConstraintError";
      if (!isDuplicateEmail) {
        console.error("Signup failed:", err);
      }
      const message = isDuplicateEmail
        ? "An account with this email already exists."
        : "Unable to create your account. Please try again.";
      io.to(socket.id).emit("error", message);
    }
  };
  socket.on("signup", signupHandler);
};

// Login user
exports.userConnection = async (io, socket, users) => {
  const connectionHandler = async (obj) => {
    try {
      const email = obj?.email?.trim().toLowerCase();
      const password = obj?.password;
      if (!email || typeof password !== "string" || !password) {
        io.to(socket.id).emit("error", "Please enter your email and password.");
        return;
      }

      const userExist = await User.findOne({ where: { email } });
      if (!userExist) {
        io.to(socket.id).emit("error", "Invalid email or password.");
        return;
      }

      const passwordMatches = await bcrypt.compare(password, userExist.dataValues.password);
      if (!passwordMatches) {
        io.to(socket.id).emit("error", "Invalid email or password.");
        return;
      }

      users[socket.id] = userExist.dataValues;
      socket.broadcast.emit("user-joined", userExist.dataValues.username);

      const oldMessage = await Message.findAll({
        include: [{ model: User, attributes: ["id", "username", "email"] }],
        order: [["createdAt", "ASC"]],
      });

      const sanitizedOldMessages = oldMessage.map((message) => {
        const data = message.toJSON ? message.toJSON() : message;
        return {
          ...data,
          user: data.user || { username: "Unknown user" },
        };
      });

      // Sending old messages to requested user.
      io.to(socket.id).emit("loginSuccess", {
        oldMessage: sanitizedOldMessages,
        token: generateAccessToken(userExist.dataValues.id),
        user: {
          id: userExist.dataValues.id,
          username: userExist.dataValues.username,
          email: userExist.dataValues.email,
        },
      });
    } catch (err) {
      console.error("Login failed:", err);
      io.to(socket.id).emit("error", "Unable to log in right now. Please try again.");
    }
  };
  socket.on("new-user-join", connectionHandler);
};

exports.receiveMessage = (io, socket, users) => {
  const receiveHandler = async (obj) => {
    try {
      // Verify user token
      const userId = jwt.verify(obj.token, process.env.SCREATE_KEY_FOR_TOKEN);
      console.log(userId.user, "-----user id from token");
      const fatchingUser = await User.findByPk(userId.user);
      if (fatchingUser) {
        //store new message into database
        const messageStore = await Message.create({
          message: obj.message,
          userId: fatchingUser.dataValues.id,
        });

        if (messageStore) {
          //Sending message to user
          socket.broadcast.emit("receive", {
            message: obj.message,
            name: fatchingUser.dataValues.username,
          });
        } else {
          throw "Message can not store in database";
        }
      } else {
        throw "can not send message";
      }
    } catch (err) {
      io.to(socket.id).emit("error", err);
    }
  };
  socket.on("send", receiveHandler);
};

exports.userDisconnect = (io, socket, users) => {
  try {
    // Disconnect user
    socket.on("disconnect", (user) => {
      socket.broadcast.emit("left", { data: users[socket.id] });
      delete users[socket.id];
    });
  } catch (err) {
    io.to(socket.id).emit("error", err);
  }
};
