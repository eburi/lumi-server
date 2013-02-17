void setup()
{
    size(32,32);
    background(0);
    fill(200, 200, 255);
    PFont fontA = loadFont("courier");
    textFont(fontA, 14);
    frameRate(1);
}

int left = 8;
int r;
int g;
int b;


void draw(){
    background(0);
    int h = hour();
    if(h < 10){
        h = "0"+h;
    }
    int m = minute();
    if(m < 10){
        m = "0"+m;
    }
    int s = second();
    if(s < 10){
        s = "0"+s;
    }
    fill(0, 255-h/23*255, h/23*255);
    text(h, left, 10);
    fill(m/59*255, 0, 255-m/59*255);
    text(m, left, 20);
    fill(s/59*255, 255-s/59*255, 0);
    text(s, left, 30);
}
