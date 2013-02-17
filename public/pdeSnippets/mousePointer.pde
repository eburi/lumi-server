int nX = 0;
int nY = 0;

void setup(){
  size( 32, 32 );
  frameRate(60);
}

void draw(){
    nX = mouseX;
    nY = mouseY;  
    
    background(0);
    stroke(255, 255, 40);
    line(nX, nY - 3, nX, nY + 3);
    line(nX - 3, nY, nX + 3, nY);
}


