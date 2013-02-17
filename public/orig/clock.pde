// All Examples Written by Casey Reas and Ben Fry
// unless otherwise stated.
void setup() {
  size(32, 32);
  stroke(255);
  smooth();
}

void draw() {
  background(0);
  fill(80);
  noStroke();

  // Angles for sin() and cos() start at 3 o'clock;
  // subtract HALF_PI to make them start at the top
  ellipse(100, 100, 160, 160);
  float s = map(second(), 0, 60, 0, TWO_PI) - HALF_PI;
  float m = map(minute(), 0, 60, 0, TWO_PI) - HALF_PI;
  float h = map(hour() % 12, 0, 12, 0, TWO_PI) - HALF_PI;
  stroke(255);
  strokeWeight(1);
  line(16, 16, cos(s) * 72 + 16, sin(s) * 72 + 16);
  strokeWeight(2);
  line(16, 16, cos(m) * 60 + 16, sin(m) * 60 + 16);
  strokeWeight(4);
  line(16, 16, cos(h) * 50 + 16, sin(h) * 50 + 16);
}
