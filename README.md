#Flow-backend


What is up gentlemen. This is George's first commit to the backend repository

#HOW DO?

   If you want to test this out, you will first need to install node, express, and mongo. There are literally infinity tutorials on how to do this whether you're running Windows, OSX, or ChromeOS (jk lol). Once you have done that, open the terminal or whatever it is called on windows, make sure you're in this directory, and run 'node index.js'. This will start running the code. You should see a message that says 'Flow is listening on port 3000'. The only thing that the backend can do at the moment is listen for a usageEvent and return its data to the command line. To test this out, with the code running, open a web browser and navigate to 'http://localhost:3000/api/usageEvent?id=1234&startTime=now&endTime=later&totalVolume=tons'. If you'll notice, this url passes 4 parameters to the backend (id, startTime, endTime, and totalVolume). You should see the passed in values show up as output in the command line. You can change the values that you pass in through the url to play with it. Have great lives.
