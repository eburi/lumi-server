void setup() {
	size(32,32);
	noStroke();
}

void draw() {
        background(0);
	for (i = 0; i < 32; i++) {
		strokeWeight(7);
		stroke((cos(millis()/150.0+i/4)+1)*127,128+cos(millis()*0.0001)*64, 128+sin(millis()*0.00015)*64);
		fill((sin(millis()/150.0+i/4)+1)*50,cos(millis()*0.0001)*64, sin(millis()*0.00015)*64);
 		ellipse(sin(millis()/800.0+i/25)*100+width/2, sin(millis()/600.0+i/20)*100+height/2, 550-i*18, 550-i*18);
	}
}
