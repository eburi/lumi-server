      void setup(){
        size(32, 32, P3D); 
        background(0);
        lights();
      }

      int r = 0;
      int g = 0;
      int b = 255;

      int cubeSize = 100; //percent
      bool cubeDir = 0;

      int cycleStep = 0;

      int step = 13;

      void draw(){

        if(cycleStep == 0){
          r += step;
          if(r >= 255){
            r = 255;
            cycleStep++;
          }
        }
        if(cycleStep == 1){
          b -= step;
          if(b <= 0){
            b = 0;
            cycleStep++;
          }
        }

        if(cycleStep == 2){
          g += step;
          if(g >= 255){
            g = 255;
            cycleStep++;
          }
        }

        if(cycleStep == 3){
          r -= step;
          if(r <= 0){
            r = 0;
            cycleStep++;
          }
        }

        if(cycleStep == 4){
          b += step;
          if(b >= 255){
            b = 255;
            cycleStep++;
          }
        }

        if(cycleStep == 5){
          g -= step;
          if(g <= 0){
            g = 0;
            cycleStep = 0;
          }
        }



        lights();
        background(0);
        strokeWeight(1);
        stroke(r, g, b);
        noFill();

        //fill(g, r, b);
        //noStroke();

        pushMatrix();
        translate(width/2, height/2, 0);
        rotateX(frameCount * PI/80);
        rotateY(frameCount * PI/110);
        box((width/2.1) / 100 * cubeSize );

        if(cubeDir == 0){
          cubeSize--;
          if(cubeSize <= 80){
            cubeDir = 1;
          }

        } else {

          cubeSize++;
          if(cubeSize >= 110){
            cubeDir = 0;
          }
        }
        popMatrix();
      } 

