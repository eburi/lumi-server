void setup() {
	size(32,32);
	background(0);
}

int pX = 0;
int pY = 0;
int dX = 1;
int dY = 1;

void draw() {
	pX = pX + dX;
  pY = pY + dY;
	if( pX > width ) {
		pX = width;
		dX = -1 * dX;
	}
  if( pX < 0 ) {
		pX = 0;
		dX = -1 * dX;
	}
	if( pY > height ) {
		pY = height;
		dY = -1 * dY;
	}
  if( pY < 0 ) {
		pY = 0;
		dY = -1 * dY;
	}
	point(pX,pY);
}
