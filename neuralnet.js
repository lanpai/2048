function Neuron(value, prevLayerSize, baseNet) {
    this.value = value ? value : 0;
    this.prevLayerSize = prevLayerSize ? prevLayerSize : 0;
    this.weights = [];
    if (!baseNet) {
        for (var i = 0; i < this.prevLayerSize; i++)
            this.weights.push(Math.random());
    }
    else {
        //console.log(baseNet);
        for (var i = 0; i < baseNet.length; i++)
            this.weights.push(baseNet[i] * (Math.random() * (1.05 - 0.95) + 0.95));
    }
}

function NeuralNet() {
    this.events = {};
    this.start = false;
    this.speed = 5;

    this.score = 0;

    this.generation = []; // generations -> networks -> layers -> neurons
    this.currentGeneration = -1;
    this.currentNetwork = -1;
    this.maxNetworks = 99;

    this.currentGenHighest = 0;
    this.currentTurnHighest = 0;

    this.genHigh = [];


    /* Generation
     *     Best Score
     *     Network
     *         Score
     *         Layers
     */

    this.grid = [];
    for (var i = 0; i < 4; i++) {
        this.grid.push([]);
        for (var k = 0; k < 4; k++)
            this.grid[i].push(0)
    }

    this.listen();
}

NeuralNet.prototype.on = function (event, callback) {
    if (!this.events[event]) {
        this.events[event] = [];
    }
    this.events[event].push(callback);
};

NeuralNet.prototype.emit = function (event, data) {
    var callbacks = this.events[event];
    if (callbacks) {
        callbacks.forEach(function (callback) {
            callback(data);
        });
    }
};

NeuralNet.prototype.listen = function () {
    var self = this;

    var map = {
        0: "▲", // Up
        1: "▶", // Right
        2: "▼", // Down
        3: "◀" // Left
    };

    var ctx = document.getElementById('growth-chart').getContext('2d');
    var chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: "Score (High)",
                borderColor: 'rgb(255, 99, 132)',
                data: []
            },
            {
                label: "Score (Mean)",
                borderColor: 'rgb(153, 102, 255)',
                data: []
            }]
        },
        options: {
        }
    });
	
	var ctx = document.getElementById('diversity-chart').getContext('2d');
    var chartDiv = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: "Move Diversity (High)",
                borderColor: 'rgb(75, 192, 192)',
                data: []
            },
            {
                label: "Move Diversity (Mean)",
                borderColor: 'rgb(255, 206, 86)',
                data: []
            },
            {
                label: "Move Diversity (Low)",
                borderColor: 'rgb(54, 162, 235)',
                data: []
            }]
        },
        options: {
        }
    });
	
	var ctx = document.getElementById('moves-chart').getContext('2d');
    var chartMoves = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: "Up",
                borderColor: 'rgb(255, 99, 132)',
                data: []
            },
            {
                label: "Right",
                borderColor: 'rgb(255, 159, 64)',
                data: []
            },
            {
                label: "Down",
                borderColor: 'rgb(75, 192, 192)',
                data: []
            },
			{
                label: "Left",
                borderColor: 'rgb(54, 162, 235)',
                data: []
            }]
        },
        options: {
        }
    });

    var speed = this.speed;
    var scores = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    var moves = [];
    var turns = 0;
    var loop = setInterval(loopFunc, speed);
    var bestNetworks = [];
	
	var divLow = 0;
	var divMean = 0;
	var divHigh = 0;
	
	var totalMoveCount = [0, 0, 0, 0];

    function compare(a, b) {
        if (a.score < b.score)
            return 1;
        if (a.score > b.score)
            return -1;
        return 0;
    }

    function loopFunc() {
        if (self.start) {
            if (self.currentGeneration === -1) {
                self.generation.push({ networks: [], bestScore: 0 });
                self.currentGeneration++;
            }
            if (self.currentNetwork === -1) {
				chartDiv.data.labels.push(self.currentGeneration + 1);
				chart.data.labels.push(self.currentGeneration + 1);
				chartMoves.data.labels.push(self.currentGeneration + 1);
				chartDiv.update();
				chart.update();
				
                for (var i = 0; i < self.maxNetworks; i++) {
                    self.generation[self.generation.length - 1].networks.push({ layers: [], score: 0 });

                    const layerCounts = [0, 24, 12, 5, 4];
                    for (var j = 1; j < layerCounts.length; j++) {
                        self.generation[self.generation.length - 1].networks[i].layers[j - 1] = [];
                        for (var k = 0; k < layerCounts[j]; k++) {
                            if (bestNetworks.length !== 0) {
                                baseLayer = [];
                                
                                for (var weight = 0; weight < layerCounts[j - 1]; weight++) {
                                    var sumWeights = 0;
                                    for (var network = 0; network < bestNetworks.length; network++) {
                                        sumWeights += bestNetworks[network].layers[j - 1][k].weights[weight];
                                    }
                                    baseLayer.push(sumWeights / layerCounts[j - 1]);
                                }
                                //console.log(baseLayer);

                                self.generation[self.generation.length - 1].networks[i].layers[j - 1].push(new Neuron(0, layerCounts[j - 1], baseLayer));
                            }
                            else {
                                self.generation[self.generation.length - 1].networks[i].layers[j - 1].push(new Neuron(0, layerCounts[j - 1]));
                            }
                        }
                    }
                }
                self.currentNetwork++;
            }

            //self.emit("move", Math.floor(Math.random() * 4));
            var input = [];
            for (var i = 0; i < self.grid.length; i++) {
                for (var j = 0; j < self.grid[i].length; j++) {
                    input.push(self.grid[i][j] ? Math.log(self.grid[i][j].value) / Math.log(2) : 0);
                }
            }
            //for (var i = 0; i < 6; i++)
                //input.push(moves[i] ? moves[i] : -1);
			//input.push(turns);
            var history = [0, 0, 0, 0, 0, 0, 0, 0];
            for (var i = 0; i < 8; i++)
                if (moves[i] && i == moves[Math.floor(i / 4)])
                    history[i] = 1;
            input.push(history);
            self.forwProp(input);
            var largest = 0;
            for (var j = 0; j < self.generation[self.generation.length - 1].networks[self.currentNetwork].layers[self.generation[self.generation.length - 1].networks[self.currentNetwork].layers.length - 1].length; j++) {
                if ((self.generation[self.generation.length - 1].networks[self.currentNetwork].layers[self.generation[self.generation.length - 1].networks[self.currentNetwork].layers.length - 1][j].value) >
                    (self.generation[self.generation.length - 1].networks[self.currentNetwork].layers[self.generation[self.generation.length - 1].networks[self.currentNetwork].layers.length - 1][largest].value))
                    largest = j;
            }

            scores.shift();
            scores.push(self.score);
            var end = true;
            var allZero = true;
            for (i = 1; i < scores.length; i++) {
                if (scores[i] !== scores[i - 1]) end = false;
                if (scores[i] !== 0) allZero = false;
            }
            end = (allZero && turns < 6) ? false : end;
            //console.log(scores);
            
            self.emit("move", largest);
            moves.unshift(largest);
			totalMoveCount[largest]++;
			
			chartMoves.data.datasets[0].data[self.currentGeneration] = totalMoveCount[0];
			chartMoves.data.datasets[1].data[self.currentGeneration] = totalMoveCount[1];
			chartMoves.data.datasets[2].data[self.currentGeneration] = totalMoveCount[2];
			chartMoves.data.datasets[3].data[self.currentGeneration] = totalMoveCount[3];
			chartMoves.update();
			
            //document.getElementsByClassName("move-history")[0].textContent = (map[largest][0] + document.getElementsByClassName("move-history")[0].textContent).substr(0, 300);
            if (end || self.gameOver) {
                var sumChange = 0;
                for (var i = 1; i < moves.length; i++)
                    if (moves[i] !== moves[i - 1]) sumChange++;

				var moveCount = [0, 0, 0, 0];
				for (var i = 0; i < moves.length; i++) {
					moveCount[moves[i]]++;
				}
				
				var avgMove = 0;
				for (var i = 0; i < moveCount.length; i++) {
					avgMove += moveCount[i];
				}
				avgMove /= moveCount.length;
				
				/*var sum = 0;
				for (var i = 0; i < moveCount.length; i++) {
					sum += Math.pow(moveCount[i] - avgMove, 2);
				}*/
				//var deviation = sum / moveCount.length;
				var deviation = math.std(moveCount);
                var bell = 4 * Math.pow(Math.E, deviation / (-0.15 * (turns + 1)));
				
				//console.log(moveCount, avgMove, sum, bell, (turns + 1));
				
				divMean += bell;
				divLow = Math.min(bell, divLow);
				divHigh = Math.max(bell, divHigh);
				document.getElementsByClassName("diversity-gen")[0].textContent = divHigh;

                var score = ((self.score / turns) * (1 + Math.sqrt(sumChange)) * bell);
                self.generation[self.generation.length - 1].networks[self.currentNetwork].score = score;
                self.currentGenHighest = Math.max(score, self.currentGenHighest);
                self.currentNetwork++;

                document.getElementsByClassName("num-network")[0].textContent = self.currentNetwork + 1;

                if (self.currentNetwork === self.maxNetworks) {

                    var sortSample = self.generation[self.generation.length - 1].networks;
                    sortSample.sort(compare);

                    var avgScore = 0;
                    bestNetworks = [];
                    for (var i = 0; i < self.maxNetworks; i++) {
                        if (i < (self.maxNetworks * 0.05)) bestNetworks.push(sortSample[i]);
                        avgScore += sortSample[i].score;
                    }
                    avgScore /= self.maxNetworks;
                        
                    console.log(bestNetworks);

                    self.generation[self.generation.length - 1].bestScore = self.currentGenHighest;
                    self.currentGenerationHighest = 0;
                    self.generation.push({ networks: [], bestScore: 0 });
                    self.currentGeneration++;
                    self.currentNetwork = -1;
                    document.getElementsByClassName("num-generation")[0].textContent = self.currentGeneration + 1;
                    document.getElementsByClassName("num-network")[0].textContent = 1;
                    self.genHigh.push({ score: self.currentGenHighest, turns: self.currentTurnHighest });
                    self.currentGenHighest = 0;
                    self.currentTurnHighest = 0;
                    console.log(self.genHigh);

                    

                    //console.log(chart.data);
                    chart.data.datasets[0].data.push(self.genHigh[self.genHigh.length - 1].score);
                    //chart.data.datasets[1].data.push(self.genHigh[self.genHigh.length - 1].turns);
                    chart.data.datasets[1].data.push(avgScore);
                    chart.update();
                    //console.log(chart.data);
					
					divMean /= self.maxNetworks;
					chartDiv.data.datasets[0].data.push(divHigh);
					chartDiv.data.datasets[1].data.push(divMean);
					chartDiv.data.datasets[2].data.push(divLow);
					chartDiv.update();
					divHigh = 0;
                    divMean = 0;
                    divLow = 0;

					chartMoves.data.datasets[0].data.push(totalMoveCount[0]);
					chartMoves.data.datasets[1].data.push(totalMoveCount[1]);
					chartMoves.data.datasets[2].data.push(totalMoveCount[2]);
					chartMoves.data.datasets[3].data.push(totalMoveCount[3]);
					chartMoves.update();
					totalMoveCount = [0, 0, 0, 0];
                }
                setTimeout(self.emit("restart"), self.speed * 2);
                document.getElementsByClassName("highscore-gen")[0].textContent = self.currentGenHighest ? self.currentGenHighest : 0;
                turns = 0;
                scores = [0, 0, 0, 0, 0, 0];
                //document.getElementsByClassName("move-history")[0].textContent = "_" + document.getElementsByClassName("move-history")[0].textContent;
                moves = [];
            }
            else {
                turns++;
                self.currentTurnHighest = turns > self.currentTurnHighest ? turns : self.currentTurnHighest;
                document.getElementsByClassName("highestTurn-gen")[0].textContent = self.currentTurnHighest;
            }
            //console.log(map[largest]);
        }
        if (speed !== self.speed) {
            clearInterval(loop);
            speed = self.speed;
            loop = setInterval(loopFunc, speed);
        }
    }
    
    //retry.addEventListener("click", this.restart.bind(this));

    var startToggle = document.getElementsByClassName("start-toggle")[0];
    startToggle.addEventListener("click", toggleStart.bind(this));
    function toggleStart(e) {
        if (startToggle.textContent !== "Start Continuous") {
            this.start = false;
            startToggle.textContent = "Start Continuous";
        }
        else {
            this.start = true;
            startToggle.textContent = "Pause Continuous";
        }
    }
    
    document.addEventListener("click", changeInterval.bind(this));
    function changeInterval(e) {
        if (e.toElement.classList.contains("interval"))
            this.speed = e.toElement.getAttribute("interval");
    }
	
	var saveData = document.getElementsByClassName("save-data")[0];
	document.getElementsByClassName("save")[0].addEventListener("click", saveFunc.bind());
	document.getElementsByClassName("load")[0].addEventListener("click", loadFunc.bind());
	function saveFunc() {
		saveData.value = "Saving. . .";
		if (self.currentGeneration > 0) {
			var data = {};
			data.generation = self.generation[self.currentGeneration - 1];
			data.currentGeneration = self.currentGeneration;
			data.bestNetworks = bestNetworks;
			
			data.chartMoves = {};
			data.chartMoves.datasets = {};
			for (var i = 0; i < chartMoves.data.datasets.length; i++)
				data.chartMoves.datasets[i] = chartMoves.data.datasets[i].data;
			data.chartMoves.labels = chartMoves.data.labels;
			
			data.chartDiv = {};
			data.chartDiv.datasets = {};
			for (var i = 0; i < chartDiv.data.datasets.length; i++)
				data.chartDiv.datasets[i] = chartDiv.data.datasets[i].data;
			data.chartDiv.labels = chartDiv.data.labels;
			
			data.chart = {};
			data.chart.datasets = {};
			for (var i = 0; i < chart.data.datasets.length; i++)
				data.chart.datasets[i] = chart.data.datasets[i].data;
			data.chart.labels = chart.data.labels;
			
			console.log(data);
			saveData.value = JSON.stringify(data);
		}
		else {
			saveData.value = "At least one generation must be complete. . .";
		}
	}
	function loadFunc() {
		var data = JSON.parse(saveData.value);
		saveData.value = "Loading. . .";
		
		self.generation = [data.generation, { networks: [], bestScore: 0 }];
		self.currentGeneration = data.currentGeneration;
		bestNetworks = data.bestNetworks;
		
		for (var i = 0; i < chartMoves.data.datasets.length; i++) {
			data.chartMoves.datasets[i].pop();
			chartMoves.data.datasets[i].data = data.chartMoves.datasets[i];
		}
		data.chartMoves.labels.pop();
		chartMoves.data.labels = data.chartMoves.labels;
		chartMoves.update();
		
		for (var i = 0; i < chartDiv.data.datasets.length; i++) {
			chartDiv.data.datasets[i].data = data.chartDiv.datasets[i];
		}
		data.chartDiv.labels.pop();
		chartDiv.data.labels = data.chartDiv.labels;
		chartDiv.update();
		
		for (var i = 0; i < chart.data.datasets.length; i++) {
			chart.data.datasets[i].data = data.chart.datasets[i];
		}
		data.chart.labels.pop();
		chart.data.labels = data.chart.labels;
		chart.update();
		
		scores = [0, 0, 0, 0, 0, 0, 0, 0, 0];
		moves = [];
		turns = 0;
		
		divLow = 0;
		divMean = 0;
		divHigh = 0;
		
		totalMoveCount = [0, 0, 0, 0];
		
		self.score = 0;

		self.currentNetwork = -1;
		self.maxNetworks = 99;

		self.currentGenHighest = 0;
		self.currentTurnHighest = 0;

		self.genHigh = [];
		
		document.getElementsByClassName("num-generation")[0].textContent = self.currentGeneration + 1;
		document.getElementsByClassName("num-network")[0].textContent = 1;
		
		saveData.value = "Loaded.";
	}
};

NeuralNet.prototype.restart = function (event) {
    event.preventDefault();
    this.emit("restart");
};

NeuralNet.prototype.forwProp = function (input) {
    for (var i = 0; i < input.length; i++) {
        this.generation[this.generation.length - 1].networks[this.currentNetwork].layers[0][i].value = input[i];
    }
    for (var layer = 1; layer < this.generation[this.generation.length - 1].networks[this.currentNetwork].layers.length; layer++) {
        for (var neuron = 0; neuron < this.generation[this.generation.length - 1].networks[this.currentNetwork].layers[layer].length; neuron++) {
            var total = 0;
            for (var nBef = 0; nBef < this.generation[this.generation.length - 1].networks[this.currentNetwork].layers[layer - 1].length; nBef++) {
				total += this.generation[this.generation.length - 1].networks[this.currentNetwork].layers[layer][neuron].weights[nBef] * this.generation[this.generation.length - 1].networks[this.currentNetwork].layers[layer - 1][nBef].value;
            }
            this.generation[this.generation.length - 1].networks[this.currentNetwork].layers[layer][neuron].value = Math.atan(total);
        }
    }
}

NeuralNet.prototype.updateGrid = function (newGrid) {
    this.grid = newGrid;
}

NeuralNet.prototype.updateScore = function (newScore) {
    this.score = newScore;
}
