const crypto = require("crypto");
const bcrypt = require("bcrypt");
const database = require("../database/functions");

function validateEmail(email) {
  const emailRegex =
    /^[a-zA-Z0-9_.+]+(?<!^[0-9]*)@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
  if (email && email !== "" && email.match(emailRegex)) return true;

  return false;
}

// Register
function validateName(name) {
  const nameRegex = /^[a-z ,.'-]+$/i;
  if (name && name !== "" && name.match(nameRegex)) return true;

  return false;
}

function validatePassowrd(password, confirmedPassword) {
  if (password !== confirmedPassword) return false;
  return true;
}

async function addNewUser(firstname, lastname, email, password) {
  try {
    const hashedPassword = await securePassword(password);
    return database.addNewUser(firstname, lastname, email, hashedPassword);
  } catch (err) {
    throw err;
  }
}

async function doesEmailExistDB(email) {
  return await database.checkIfEmailExists(email);
}

// userInformation = {
//     firstname: "Philip",
//     lastname: "CODE",
//     email: "example@code.berlin",
//     password: "somethingSalty"
// }
async function registerNewAccount(userInformation) {
  if (
    !userInformation?.firstname ||
    !userInformation?.lastname ||
    !userInformation?.email ||
    !userInformation?.password ||
    !userInformation?.confirmPassword
  ) {
    return {
      success: false,
      httpCode: 400,
      errorMessage: "Missing some credentials for registration process",
    };
  }

  const { firstname, lastname, email, password, confirmPassword, terms } =
    userInformation;

  if (terms !== "on") {
    return {
      success: false,
      httpCode: 400,
      errorMessage: "Terms and Privacy Policy must be accepted  ",
    };
  }

  const isPasswordValid = validatePassowrd(password, confirmPassword);
  if (!isPasswordValid)
    return {
      success: false,
      httpCode: 400,
      errorMessage: "Provided passwords do not match",
    };

  const isEmailValid = validateEmail(email);
  if (!isEmailValid)
    return {
      success: false,
      httpCode: 400,
      errorMessage: "Provided invalid email address",
    };

  const isFirstnameValid = validateName(firstname);
  if (!isFirstnameValid)
    return {
      success: false,
      httpCode: 400,
      errorMessage: "Provided invalid firstname",
    };

  const isLastnameValid = validateName(lastname);
  if (!isLastnameValid)
    return {
      success: false,
      httpCode: 400,
      errorMessage: "Provided invalid lastname",
    };

  const doesUserExist = await doesEmailExistDB(email);

  if (doesUserExist) {
    return {
      success: false,
      httpCode: 409,
      errorMessage: "Specified email is already taken",
    };
  }

  const result = await addNewUser(firstname, lastname, email, password);
  if (result) {
    return {
      success: true,
      httpCode: 201,
      message: "Account has been created successfully!",
    };
  } else {
    return {
      success: false,
      httpCode: 500,
      errorMessage: "Something went wrong while creating an account",
    };
  }
}
// Register

// Login
async function loginAccount(userInformation) {
  if (!userInformation?.email || !userInformation?.password) {
    return {
      success: false,
      httpCode: 400,
      errorMessage: "Missing some credentials for registration process",
    };
  }

  const { email, password, remember } = userInformation;

  const isEmailValid = validateEmail(email);
  if (!isEmailValid)
    return {
      success: false,
      httpCode: 400,
      errorMessage: "Provided invalid email address",
    };

  const areCredentialsValid = await database.verifyUserCredentialsByEmail(
    email,
    password,
  );

  if (!areCredentialsValid) {
    return {
      success: false,
      httpCode: 401,
      errorMessage: "Password or email address is does not match an account!",
    };
  }

  return {
    success: true,
    httpCode: 200,
    message: "Successfully logged in!",
  };
}

function generateSessionToken() {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(48, function (err, buffer) {
      if (err) reject(err);
      const token = buffer.toString("hex");
      resolve(token);
    });
  });
}
// Login

// Utils
async function bcryptComparePasswords(plainTextPassword, hashedPassword) {
  return await bcrypt.compare(plainTextPassword, hashedPassword);
}

async function securePassword(password) {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);
  return await bcrypt.hash(password, saltRounds);
}

module.exports = {
  // register
  registerNewAccount,

  // login
  loginAccount,
  generateSessionToken,

  // utils
  bcryptComparePasswords,
  securePassword,
};
