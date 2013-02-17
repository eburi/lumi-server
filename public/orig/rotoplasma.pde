// Tiled Sprite Scaling and Rotation (Factors of 2)
// aka Rotoblitting plus Plasma
// March 2004 - Source image is 512x512
// Using fixed-point mathematics
//
// based on Future Crew's Unreal tiled blitting/rotation
// tutorial by justin deltener (inversereality.org)
// applet by mad merv (madmerv.com)

BImage Buffer;	//A buffer used to store the image

// quasimondo's superfastblur
// http://incubator.quasimondo.com/processing
void fastblur(int radius){

  if (radius<1){
    return;
  }
  int w=width;
  int h=height;
  int wm=w-1;
  int hm=h-1;
  int wh=w*h;
  int div=radius+radius+1;
  int r[]=new int[wh];
  int g[]=new int[wh];
  int b[]=new int[wh];
  int rsum,gsum,bsum,x,y,i,p,p1,p2,yp,yi,yw;
  int vmin[] = new int[max(w,h)];
  int vmax[] = new int[max(w,h)];
  int[] pix=pixels;
  int dv[]=new int[256*div];
  for (i=0;i<256*div;i++){
    dv[i]=(i/div);
  }

  yw=yi=0;

  for (y=0;y<h;y++){
    rsum=gsum=bsum=0;
    for(i=-radius;i<=radius;i++){
      p=pix[yi+min(wm,max(i,0))];
      rsum+=(p & 0xff0000)>>16;
      gsum+=(p & 0x00ff00)>>8;
      bsum+= p & 0x0000ff;
    }
    for (x=0;x<w;x++){

      r[yi]=dv[rsum];
      g[yi]=dv[gsum];
      b[yi]=dv[bsum];

      if(y==0){
        vmin[x]=min(x+radius+1,wm);
        vmax[x]=max(x-radius,0);
      }
      p1=pix[yw+vmin[x]];
      p2=pix[yw+vmax[x]];

      rsum+=((p1 & 0xff0000)-(p2 & 0xff0000))>>16;
      gsum+=((p1 & 0x00ff00)-(p2 & 0x00ff00))>>8;
      bsum+= (p1 & 0x0000ff)-(p2 & 0x0000ff);
      yi++;
    }
    yw+=w;
  }

  for (x=0;x<w;x++){
    rsum=gsum=bsum=0;
    yp=-radius*w;
    for(i=-radius;i<=radius;i++){
      yi=max(0,yp)+x;
      rsum+=r[yi];
      gsum+=g[yi];
      bsum+=b[yi];
      yp+=w;
    }
    yi=x;
    for (y=0;y<h;y++){
      pix[yi]=0xff000000 | (dv[rsum]<<16) | (dv[gsum]<<8) | dv[bsum];
      if(x==0){
        vmin[y]=min(y+radius+1,hm)*w;
        vmax[y]=max(y-radius,0)*w;
      }
      p1=x+vmin[y];
      p2=x+vmax[y];

      rsum+=r[p1]-r[p2];
      gsum+=g[p1]-g[p2];
      bsum+=b[p1]-b[p2];

      yi+=w;
    }
  }

}

// works only with images of dimension factor by 2
void RotateAndScale(BImage I, float angle, float s)
{ long rowU,rowV,startingU,startingV;
  long duCol,dvCol,duRow,dvRow;
  int x,y;
  long u,v;

  startingU=(I.width/2)<<16;
  startingV=(I.height/2)<<16;

  duCol=(long)(sin(angle+90)*s *0x10000);
  dvCol=(long)(sin(angle)*s *0x10000);

  duRow=-dvCol;
  dvRow= duCol;

  startingU-=(width/2)*duCol+(height/2)*duRow;
  startingV-=(width/2)*dvCol+(height/2)*dvRow;
  rowU=startingU;
  rowV=startingV;
  for(y=0;y<height;y++)
  {u=rowU;
    v=rowV;
    for(x=0;x<width;x++)
    { pixels[y*height+x] += I.pixels[int((u >>16&(I.width-1) )
      +(v >>16&(I.height-1) )*I.width)];
      // normally the above assignment uses a simple = operator
      u+=duCol;
      v+=dvCol;
    }
    rowU+=duRow;
    rowV+=dvRow;
  }
}

// Plasma fractal generator
// By Mad Merv - March 2004

//  Original applet written January, 2002 by Justin Seyster

/*
A scientific name for this type of fractals would be:
Random Midpoint Displacement Fractals.

In fractint they are called plasma; another popular name
for them is: fractal clouds.

Here is a simplified explanation of the
(recursive / iterative) algorithm:

initialisation:
generate random values for 4 corners of a rectangle A,B,C,D

iteration:
divide the rectangle in 4 smaller ones, calculate values for the
5 new points (midpoints on the sides and center): those values are
a SUM (mean value of the endpoints defining the midpoint) PLUS
(pos. or neg. random value proportional to size of segment)

stop criteria:
the previous step is repeated until the size of the
subrectangles will be smaller than one pixel.
*/

float seed=1;

// color components
float r=255;
float g=255;
float b=255;

//Randomly displaces color value for midpoint depending on size
//of grid piece.
float Displace(float num)
{
  float max = num / (float)(width + height) * 3;
  return (random(seed) - 0.5f) * max;
}

//Returns a color based on a color value, c.
color ComputeColor(float c)
{
  float Red = 0;
  float Green = 0;
  float Blue = 0;

  if (c < 0.5f)
  {
    Red = c * 2;
  }
  else
  {
    Red = (1.0f - c) * 2;
  }

  if (c >= 0.3f && c < 0.8f)
  {
    Green = (c - 0.3f) * 2;
  }
  else if (c < 0.3f)
  {
    Green = (0.3f - c) * 2;
  }
  else
  {
    Green = (1.3f - c) * 2;
  }

  if (c >= 0.5f)
  {
    Blue = (c - 0.5f) * 2;
  }
  else
  {
    Blue = (0.5f - c) * 2;
  }

  Red *=r;
  Green *=g;
  Blue *=b;

  return color(Red, Green, Blue);
}

//This is something of a "helper function" to create an initial grid
//before the recursive function is called.
void drawPlasma(int width, int height)
{
  float c1, c2, c3, c4;

  //Assign the four corners of the intial grid random color values
  //These will end up being the colors of the four corners of the applet.
  c1 = random(seed);
  c2 = random(seed);
  c3 = random(seed);
  c4 = random(seed);

  DivideGrid(0, 0, width , height , c1, c2, c3, c4);
}

//This is the recursive function that implements the random midpoint
//displacement algorithm.  It will call itself until the grid pieces
//become smaller than one pixel.
void DivideGrid(float x, float y, float width, float height, float c1, float c2, float c3, float c4)
{
  float Edge1, Edge2, Edge3, Edge4, Middle;
  float newWidth = width / 2;
  float newHeight = height / 2;

  if (width > 2 || height > 2)
  {
    Middle = (c1 + c2 + c3 + c4) / 4 + Displace(newWidth + newHeight);	//Randomly displace the midpoint!
    Edge1 = (c1 + c2) / 2 ;	//Calculate the edges by averaging the two corners of each edge.
    Edge2 = (c2 + c3) / 2 ;
    Edge3 = (c3 + c4) / 2 ;
    Edge4 = (c4 + c1) / 2 ;

    //Make sure that the midpoint doesn't accidentally "randomly displaced" past the boundaries!
    if (Middle < 0)
    {
      Middle = 0;
    }
    else if (Middle > 1.0f)
    {
      Middle = 1.0f;
    }

    //Do the operation over again for each of the four new grids.
    DivideGrid(x, y, newWidth, newHeight, c1, Edge1, Middle, Edge4);
    DivideGrid(x + newWidth, y, newWidth, newHeight, Edge1, c2, Edge2, Middle);
    DivideGrid(x + newWidth, y + newHeight, newWidth, newHeight, Middle, Edge2, c3, Edge3);
    DivideGrid(x, y + newHeight, newWidth, newHeight, Edge4, Middle, Edge3, c4);
  }
  else	//This is the "base case," where each grid piece is less than the size of a pixel.
  {
    //The four corners of the grid piece will be averaged and drawn as a single pixel.
    float c = (c1 + c2 + c3 + c4) / 4;
    set((int)x, (int)y, ComputeColor(c));

    /* comment out if not 1:1 aspect */
    set((int)x, (int)y+1, get((int)x,(int)y));
    set((int)x+1, (int)y, get((int)x,(int)y));
    set((int)x+1, (int)y+1, get((int)x,(int)y));
  }
}

//modify color component when dragged
void mouseDragged() {
  //seed = random(seed);
  r=mouseX;
  g=mouseY;
  // b=mouseZ;
  b=mouseX*mouseY/2;
  drawPlasma(width, height);
}

//Draw a new plasma fractal whenever the applet is clicked.
void mousePressed() {
mouseX/=10;
mouseY/=10;
  //seed = random(seed);
  r=mouseX;
  g=mouseY;
  // b=mouseZ;
  b=mouseX*mouseY/2;
  drawPlasma(width, height);
  // blit the screen contents into the buffer
  for ( int x=0; x<width; x++ )
  for ( int y=0; y<height; y++ )
  Buffer.pixels[x+y*width]=pixels[x+y*width];
}

void setup() {
  size(256,256);  // must be a power of 2 (2,4,8,16,32..)
  background(0);
  noStroke();
  Buffer = new BImage(width, height);	//Set up the graphics buffer and context.
  drawPlasma(width, height);	                //Draw the first plasma fractal.
  // blit the screen contents into the buffer
  for ( int x=0; x<width; x++ )
  for ( int y=0; y<height; y++ )
  Buffer.pixels[x+y*width]=pixels[x+y*width];
}

float angle=0.0;
float delta=0.1;
int i=400; // counter
boolean blur=true;

void keyPressed() {
  switch( key ) {
   case 'b':blur=!blur; break;
   case 't': 
    drawPlasma(0,0);      
    for ( int x=0; x<width; x++ )
    for ( int y=0; y<height; y++ ) Buffer.pixels[x+y*width]=pixels[x+y*width];
    i=500; // delay factor
   break;
  case 'l': 
    drawPlasma(1,1);       
    for ( int x=0; x<width; x++ )
    for ( int y=0; y<height; y++ ) Buffer.pixels[x+y*width]=pixels[x+y*width];
    i=500; // delay factor
   break;
  default: break;
  }
}

void loop() {
angle += delta;
if ( angle > PI+PI/2 || angle <= 0 ) delta = -delta;
RotateAndScale(Buffer,angle,angle);
if (blur==true) fastblur(width/height);
delay(60);
if ( --i<1 ) {
drawPlasma(int(random(1)*width), int(random(1)*height));	                //Draw the first plasma fractal.
// blit the screen contents into the buffer
for ( int x=0; x<width; x++ )
for ( int y=0; y<height; y++ )
Buffer.pixels[x+y*width]=pixels[x+y*width];
i=500; // delay factor
}
}

