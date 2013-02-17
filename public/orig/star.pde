void setup() {
  size(32,32);
  frameRate(25);
}

void draw() {
  translate( width/2, height/2 );
  for( int j =20; j >=-1; j--) {
    if ( j % 2 == 0 ) {
      fill( 255,255,0);
    } else {
      fill(0,0,0);
    }
    beginShape();
    for( int i=0; i<10; i++) {
      int c = frameCount % 20;
      float r = (i % 2 == 0 ? 1 * max(0, j * 10 + c) : 2 * max(0,j * 10 + c) );
      vertex( r * cos( i*TWO_PI/10), r*sin(i*TWO_PI/10));
    }
    endShape(CLOSE);
  }
}
