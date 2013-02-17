void setup() {
  size(32, 32, P2D);
  noSmooth();

  fill(0);
  frameRate(30);
}

void draw() {
  background(0);
  translate(width/2,height/2);
  float rotClock = millis()*0.0001;

  for (int i = 1;i<22;i+=1) {
  pushMatrix();
	float mod = (sin(millis()*0.0002)+cos(millis()*0.0005))*3;
	rotate((rotClock*i)*0.3);
  	noStroke();
	fill(20+(cos(i*0.15)*64),0,12+(sin(i*3)*64),20);
  	triangle(0-mod,0,10,10-mod,5,15+mod);
  popMatrix();
  }
  
}
