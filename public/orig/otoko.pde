void setup() {
	size(32,32);
	frameRate(30);
	noStroke();
	noSmooth();
}
void draw() {
	background(0);
	for (int y=0;y<height/2;y++) {
		for (int x=1;x<width;x++) {
			size = 2 + cos(millis()*0.001+x+cos(y+millis()*0.008)*(sin(x-0.002)*2))*2;
			fill(size*10);
			ellipse(x*4, y*4, size, size);
		}
	}
}
