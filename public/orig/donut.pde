void setup() {
	size(32,32);	
	noStroke();
        noSmooth();
}

void draw() {
	background(0);
	noFill();
	pushMatrix();
		for (int i = 0;i<10;i+=2) {
			translate(width/2,height/2);

			rotate(i*0.01*cos(millis()*0.0001));
			translate(-width/2,-height/2);
	
			strokeWeight(3+i*0.8);
			stroke(i*3,i*2,i,i*6);
			float size = width/2+sin(millis()*0.00005*i+cos(millis()*0.00001)*15)*width/2; // size of the animating ellipse
			ellipse(width/2+cos(millis()*0.003+i*0.005)*width/16,height/2+sin(millis()*0.003+i*0.004)*height/16,size,size); // draw the ellipse at the center of the canvas
		}
	popMatrix();

}
