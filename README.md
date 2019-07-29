# TimeTracker

- Frontend: [Github Repo](https://github.com/srad1292/Time_Tracker_Frontend)
- Backend: [Github Repo](https://github.com/srad1292/Time_Tracker_Backend)

## Versions Of Tools
- Angular-cli version: 7.2.4
- Node version: 10.15.0
- NPM version: 6.4.1


## Setup 

- Create Time_Tracker directory to store frontend and backend directories

### Backend
- Go into that directory and clone the backend directory 
- Go into the Time_Tracker_Backend directory and run: **npm install**

### Connect to a mongo host
- i just use mongo compass and connect to the default (localhost:27017)
- in backend/db-setup/create_database ensure the middle section is your host:port 
- in backend/server.js ensure that the mongo url variable is using the correct host:port 

### Backend cont
- in backend/server.js ensure the corsoption origin is set to match angular (for me localhost:4200)
- in a bash terminal, run: **node db-setup/create_database.js** 

### Frontend
- Go to the Time_Tracker directory in a new bash terminal
- Clone the frontend directory 
- Go into Time_Tracker_Frontend and run: **npm install**

### Both
- In backend/server.js there is app.listen.  Make sure this port is the same as the port used in the UserService and ActivityService in angular app/shared/services/...

### Backend Cont
- In the bash terminal, run: **node server.js**

### Frontend cont
- In the bash terminal, run: **ng serve --open**


## Usage
- No Account?  Under the login form is a link to the registration component where you can create an account and then login 
- Account? Login!

- The home page goes to the current date and lists your activities for the day 
- Click on the new activity button to open a form to create a new activity 
- You can start a timer and you can also give it a time elapsed to start with if you don't want to wait so long 
- You can switch to different dates on the home page

- The history page will show you all of your saved activities
- You can click the show form button to open a form to filter your activities by a start date, end date, or search by description

- The graph page will give you three graph types to choose from currently. 
- The function is set up so that it would be really easy to add more options.

