void setup(){
	size(32, 32, P2D); 
	background(0);
}

int r = 0;
int g = 0;
int b = 255;

int cycleStep = 0;

int step = 32;
int x = 0;

void draw(){

	if(cycleStep == 0){
		r += step;
		if(r >= 255){
			r = 255;
			cycleStep++;
		}
	}

	if(cycleStep == 1){
		b -= step;
		if(b <= 0){
			b = 0;
			cycleStep++;
		}
	}

	if(cycleStep == 2){
		g += step;
		if(g >= 255){
			g = 255;
			cycleStep++;
		}
	}

	if(cycleStep == 3){
		r -= step;
		if(r <= 0){
			r = 0;
			cycleStep++;
		}
	}

	if(cycleStep == 4){
		b += step;
		if(b >= 255){
			b = 255;
			cycleStep++;
		}
	}

	if(cycleStep == 5){
		g -= step;
		if(g <= 0){
			g = 0;
			cycleStep = 0;
		}
	}



    stroke(r, g, b);
	line(0, x, 32, x)
    x++;
    if(x > 32){
       x = 0; 
    }
    fill(0, 0, 0, 25);
    rect(-1, -1, 34, 34);
} 
	    	
					
	    	
					
