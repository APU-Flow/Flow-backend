# Flow-backend

What is up gentlemen. This is the backend Node.js application powering the Flow server.

# HOW DO?

## Making backend requests
For those of you who are working on the app or the hardware, you will eventually need to make requests to the backend. I am writing this doc to help you do this if you don’t already know how. You will need to find out how to make an http GET request within the language that you are working with. A request has two parts, the url and the parameters. The url is made up of two parts, the address of the server (in our case 138.68.56.236), and the api route or the route to the function you want to run on the backend. If you want to test this functionality, assuming the backend code is running on the server, you can open any web browser and make a request by going to an address made up the url and the parameters in the following form: http://URL?param1=VALUE&param2=VALUE. If you are making a request and want to see if it worked, you can ssh into the server and run the command “less /var/log/George/backend.txt” which will show you the contents of the log file for the backend. You may need to add “sudo “ to the beginning of this command if you get a permission denied error


## API routes
In this document, I will keep track of the function addresses and parameter names so that you can just refer to this when you are working on the app and need to send/recieve/whatever things to/from the backend


### USAGE EVENT
Url: http://138.68.56.236/api/usageEvent 
Parameters: ‘id’, ‘startTime’, ‘endTime’, ‘totalVolume’
Example:
http://138.68.56.236:3000/api/usageEvent?id=123&startTime=5&endTime=0&totalVolume=lots


### NEW USER
Url: http://138.68.56.236/api/newUser 
Parameters: ‘firstName’’, ‘lastName’’, ‘streetAddress’, ‘city’, ‘state’, ‘email’, ‘password’
Example:  http://138.68.56.236:3000/api/newUser?firstName=george&lastName=Vine&streetAddress=streed&city=azusa&state=CA&email=gmail.com&password=password


### LOGIN
Url: http://138.68.56.236/api/login 
Parameters: ‘email’, ‘password
Example:  http://138.68.56.236:3000/api/newUser?email=gmail.com&password=ps1234
