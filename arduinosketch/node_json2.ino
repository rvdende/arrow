

void setup() 
{                
  //pinMode(10, OUTPUT);    
  Serial.begin(115200); 
}

int a0 = 0;
int a1 = 0;
int a2 = 0;
int a3 = 0;
int a4 = 0;
int a5 = 0;

void loop() 
{
  a0 = analogRead(A0);
  a1 = analogRead(A1);  
  a2 = analogRead(A2);  
  a3 = analogRead(A3);  
  a4 = analogRead(A4);    
  a5 = analogRead(A5);      
  
  String jsonString = "";
  jsonString += "{";
  jsonString += "\"A0\":\"";
  jsonString += a0;
  jsonString += "\",";
  jsonString += "\"A1\":\"";
  jsonString += a1;
  jsonString += "\",";  
  jsonString += "\"A2\":\"";
  jsonString += a2;  
  jsonString += "\",";    
  jsonString += "\"A3\":\"";
  jsonString += a3;  
  jsonString += "\",";    
  jsonString += "\"A4\":\"";
  jsonString += a4;  
  jsonString += "\",";    
  jsonString += "\"A5\":\"";
  jsonString += a5;    
  jsonString += "\"}";
  Serial.println(jsonString);  
}
