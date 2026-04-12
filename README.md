# SE_19 Hand-in 4

This repository contains a simple server-side rendered web backend built with Express, EJS, and Node.js.

The project fulfills the Hand-in 4 requirements by being deployed and secure.
This version features profile avatars aswell as notes that can be created, updated, and deleted.
These notes can be shared, but are only read-only for others and not live updating. A refresh is required for others to see your changes.
The Text Editor is by [Editor.js](https://editorjs.io/). I didn't include all plugins, just the ones I thought would be neccessary.

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

- **Panel (`GET /panel`)**: Renders the home screen with server-side rendered notes from the database.
- **Account Settings (`GET /panel/account`)**: Renders the account settings dashboard with server-side rendered user data from the database.
- **Update User Data (`PATCH /panel/account/updateUserData`)**: Updates the user's first name, last name, and/or email in the database.
- **Update User Avatar (`PUT /panel/account/updateUserAvatar`)**: Updates the user's avatar in the database.
- **Change Password (`PATCH /panel/account/changePassword`)**: Verifies the current password, hashes the new password, and updates it in the database.
- **Delete Account (`DELETE /panel/account/deleteAccount`)**: Deletes the user account from the database and destroys the session.

### Notes

- **Notes (`GET /notes`)**: Redirects to `GET /panel`.
- **Editor (`GET /notes/:noteId`)**: Opens up the note with a text editor. (Requires authorization)

### API

- **Health Check (`GET /api`)**: Returns an empty 200 response.
- **Get User Data (`GET /api/getUserData`)**: Returns the authenticated user's profile data as JSON.
- **Session (`GET /api/session`)**: Returns the current session object.
- **Avatar (`GET /api/avatar`)**: Returns the authenticated user's avatar or if not authenticated the default avatar.
- **Create Note (`POST /api/createNote`)**: Creates a new note for an authenticated user.
- **Delete Note (`DELETE /api/deleteNote`)**: Deletes a note for an authenticated user.
- **Update Note Title (`PUT /api/updateNoteTitle/:noteId`)**: Updates the note title for an authenticated user that owns the note.
- **Update Note Content (`PUT /api/updateNoteContent/:noteId`)**: Updates the note content for an authenticated user that owns the note.
- **Update Note Collaborators (`POST /api/updateNotesCollaborators/:noteId`)**: Updates the note collaborators for an authenticated user that owns the note.

### Other

- **Redirect (`GET /code`)**: A route that redirects the user to the CODE University of Applied Sciences website.

## How to run

To run this backend locally, make sure you have [Node.js](https://nodejs.org) and a [MySQL](https://www.mysql.com/), [MySQL XAMPP](https://www.apachefriends.org/) or [MariaDB](https://mariadb.com/) database installed on your system.

1. Clone or download this repository:
   `git clone https://github.com/PandaaFX/CODE-SE_19-Hand-in-4.git`
2. Change into the project directory:
   `cd CODE-SE_19-Hand-in-4`
3. Install the required dependencies:
   `npm install`
4. Create a `.env` file in the root directory and specify the environment variables that are listed in `.env.example`.
5. Create an empty SQL database with the name specified in your `.env` file (default: `note_nova`).
6. Start the server in development mode:
   `npm run dev`

The server will be listening and accessible at `http://localhost:<SERVER_PORT>`.
