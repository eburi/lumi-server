void setup() {
    size(32,32);
    frameRate(30);
}

void draw() {
        color(255);
    background(0);
        for(int i=0;i<30;i++) {
        stroke(i*5);
        translate(width/2+i,height/2+i);
        rotate(sin(millis()*0.00002-cos(i*0.00002+millis()*0.00002)*4)*4);
        translate(-width/2-i,-height/2);
        line(width/2+cos(millis()*0.0001)*3,height/2-sin(millis()*0.00015)*2,4-cos(millis()*0.0001)*4,4+sin(millis()*0.00015)*4);
    }
}

/* wired version
int ctimes = 0;
void setup() {
	size(32,32);
	frameRate(30);
	stroke(55);
        background(0);
}

void curve(float angle) {
	translate(width/2,height/2);
	scale(0.93-sin(millis()*0.001+ctimes*0.00001)*0.05);
	rotate(angle+sin(millis()*0.0001)+ctimes*0.00001);
	translate(-width/2,-height/2);
	line(width/2+cos(angle+millis()*0.001)*300, height/2, cos(angle)*width, sin(angle)*height);
	ctimes++;
	if (ctimes < 5) curve(angle);
	ctimes = 0;
}

void draw() {
	background(0);
	for (int i=1;i<35;i++) {
		curve(3+i+sin(i+millis()*0.00001)*3);
	}
}
*/
