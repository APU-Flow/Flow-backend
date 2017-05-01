# Flow-backend

What is up gentlemen. This is the backend Node.js application powering the Flow server.

# HOW DO?

## Making backend requests
For those of you who are working on the app or the hardware, you will eventually need to make requests to the backend. I am writing this doc to help you do this if you don’t already know how. You will need to find out how to make an HTTP GET or POST request within the language that you are working with. A request has two parts, the url and the parameters. The parameters are transmitted as url-encoded for GET requests, and in the request body as JSON for POST requests. The url is made up of two parts, the address of the server (in our case 138.68.56.236), and the api route or the route to the function you want to run on the backend. If you want to test this functionality, assuming the backend code is running on the server, you can open any web browser and make a request by going to an address made up the url and the parameters in the following form: http://URL?param1=VALUE&param2=VALUE. If you are making a request and want to see if it worked, you can ssh into the server and run the command “less /var/log/node/Flow-backend.txt” and press the End key to skip to the end of the log. This will show you the contents of the log file for the backend, with the most recent events at the bottom.


## API routes
In this document, I will keep track of the function addresses and parameter names so that you can just refer to this when you are working on the app and need to send/recieve/whatever things to/from the backend

### POST `/login`
Attempts to log in to the server. Returns a token for authentication on /api/ routes.

### POST `/newUser`
Attempts to register a new user to the server. Does not log in newly created users.

### POST `/usageEvent`
Logs a new usage event from a Flow meter to the database.

### GET `/api/getNextMeterId`
Gets the next available unused meter ID for the logged-in user.

### GET `/api/getMeterIdList`
Gets all meter IDs associated with the logged-in user.

### POST `/api/addMeter`
Creates a database entry for a newly installed Flow meter.

### GET `/api/getDailyUsage`
Gets the logged-in user's usage for a given day, divided by hour.

### GET `/api/getWeeklyUsage`
Gets the logged-in user's usage for a given week, divided by day.

### GET `/api/getMonthlyUsage`
Gets the logged-in user's usage for a given year, divided by month.

### GET `/api/deleteUserData`
Deletes all usage events associated with the logged-in user.
