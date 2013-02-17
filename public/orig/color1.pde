void setup() {
	size(32,32);
	noStroke();
}

void draw() {
	background(0);
	float mod = 64+cos(millis()*0.001)*48;

	for (int y=0;y<height;y++) {
		for (int x=0;x<width;x++) {
			float size = cos(millis()*0.0015+x+sin(millis()*0.00025+x*0.001)*10) * sin(millis()*0.0015+y+cos(millis()*0.0002+y*0.001)*10) * 15;
			if (size < 5) size = 5+sin(millis()*0.0015+x+y)*4;
			fill(100-size*15,192-mod+x*15,150-mod-size*3,128+size);
			ellipse(x*16,y*16,size,size);
		}
	}
}
