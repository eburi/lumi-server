void setup()
{
    size(32,32);
    background(0);
    fill(255);
    PFont fontA = loadFont("courier");
    textFont(fontA, 48);
    frameRate(1);
}

int i = 0;
int left = 2;
int top = 30;

void draw(){
    background(0);
    switch(i){
        case 0:
            text("A", left, top);
        break;
        case 1:
            text("B", left, top);
        break;
        case 2:
            text("C", left, top);
        break;
        case 3:
            text("D", left, top);
        break;
        case 4:
            text("E", left, top);
        break;
        case 5:
            text("F", left, top);
        break;
        case 6:
            text("G", left, top);
        break;
        case 7:
            text("H", left, top);
        break;
        case 8:
            text("I", left, top);
        break;
        case 9:
            text("J", left, top);
        break;
        case 10:
            text("K", left, top);
        break;
        case 11:
            text("L", left, top);
        break;
        case 12:
            text("M", left, top);
        break;
        case 13:
            text("N", left, top);
        break;
        case 14:
            text("O", left, top);
        break;
        case 15:
            text("P", left, top);
        break;
        case 16:
            text("Q", left, top);
        break;
        case 17:
            text("R", left, top);
        break;
        case 18:
            text("S", left, top);
        break;
        case 19:
            text("T", left, top);
        break;
        case 20:
            text("U", left, top);
        break;
        case 21:
            text("V", left, top);
        break;
        case 22:
            text("W", left, top);
        break;
        case 23:
            text("X", left, top);
        break;
        case 24:
            text("Y", left, top);
        break;
        case 25:
            text("Z", left, top);
        break;
        default:
            text("A", left, top);
        break;
    }
    i++;
    if(i > 28){
        i = 0;
    }
}
