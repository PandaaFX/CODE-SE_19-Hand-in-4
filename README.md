# SE_19 Hand-in 3

This repository contains a simple server-side rendered web backend built with Express, EJS, and Node.js.

The project fulfills the Hand-in 3 requirements by differentiating between the roles of the web client and web server, and providing dynamic routing capabilities. It uses EJS as a server-side templating language to render database entries, MySQL as the database, and supports full CRUD operations on user accounts. It consists of the following routes:

### Landingpage

- **Home (`GET /`)**: An SSR route rendered with EJS.
- **Features (`GET /features`)**: An SSR route rendered with EJS.
- **Pricing (`GET /pricing`)**: An SSR route rendered with EJS.

### Authentication

- **Login (`GET /login`)**: Renders the login form.
- **Login (`POST /login`)**: Validates credentials, creates a session, and redirects to the panel.
- **Register (`GET /register`)**: Renders the registration form.
- **Register (`POST /register`)**: Validates input, hashes the password, creates a new user in the database, and redirects to login.
- **Logout (`GET /logout`)**: Clears the session token and destroys the session. **Requires authentication.**

### Panel (Requires authentication)

- **Panel (`GET /panel`)**: Renders the account settings dashboard with server-side rendered user data from the database.
- **Update User Data (`PATCH /panel/updateUserData`)**: Updates the user's first name, last name, and/or email in the database.
- **Change Password (`PATCH /panel/changePassword`)**: Verifies the current password, hashes the new password, and updates it in the database.
- **Delete Account (`DELETE /panel/deleteAccount`)**: Deletes the user account from the database and destroys the session.

### API

- **Health Check (`GET /api`)**: Returns an empty 200 response.
- **Get User Data (`GET /api/getUserData`)**: Returns the authenticated user's profile data as JSON.
- **Session (`GET /api/session`)**: Returns the current session object.

### Other

- **Redirect (`GET /code`)**: A route that redirects the user to the CODE University of Applied Sciences website.

## How to run

To run this backend locally, make sure you have [Node.js](https://nodejs.org) and a [MySQL](https://www.mysql.com/), [MySQL XAMPP](https://www.apachefriends.org/) or [MariaDB](https://mariadb.com/) database installed on your system.

1. Clone or download this repository:
   `git clone https://github.com/PandaaFX/CODE-SE_19-Hand-in-3.git`
2. Change into the project directory:
   `cd CODE-SE_19-Hand-in-3`
3. Install the required dependencies:
   `npm install`
4. Create a `.env` file in the root directory and specify the enviroment variables that are listed in `.env.example`.
5. Create an empty SQL database with the name specified in your `.env` file (default: `note_nova`).
6. Start the server in development mode:
   `npm run dev`

The server will be listening and accessible at `http://localhost:<SERVER_PORT>`.
