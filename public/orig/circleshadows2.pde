void setup() {
	size(32,32);
	noStroke();
}

void draw() {
	for (i = 0; i < 32; i++) {
		strokeWeight(2);
		stroke((cos(millis()/150.0+i/4)+1)*127);
		fill((sin(millis()/150.0+i/4)+1)*127);
		ellipse(sin(millis()/800.0+i/25)*100+width/2, sin(millis()/600.0+i/20)*100+height/2, 550-i*18, 550-i*18);
	}
}
