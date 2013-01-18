Add a readme.txt file to the zip the describes (1) What was hard in this ex? (2) What was fun in this ex? (We won’t reduce points in case this part is empty) (3) if you were a hacker and you could add a dynamic function that answers the URL /hello/hacker, write 2 different ‘bad’ dynamic functions that will cause DOS. how would you make sure that those functions will get executed? 

1) Understanding exactly what you wanted from us and then having to wait for forum replies for clarifications.
2) Learnt stuff.
3)
i) (infinite loop)
    server.any('/hello/hacker', {call: function (request, response, parameters) {
        while (true) {
		console.log('DOS ATTACK!');
        }
    }
    });

ii)
    server.any('/hello/hacker', {call: function (request, response, parameters) {
	setTimeout(function (){
		throw new Error("DOS ATTACK!");
	}, 1);
    }
    });

To make sure these functions are called, we'd go to localhost:port/hello/hacker in a  browser.