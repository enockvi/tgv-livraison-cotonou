const fs = require('fs');

const rawCsv = `Départ,Arrivée,Distance (km),Tarif (FCFA)
"Fidjrossè, Cotonou","Agla, Cotonou",3.9,1000
"Fidjrossè, Cotonou","Menontin, Cotonou",5.2,1200
"Fidjrossè, Cotonou","Kouhounou, Cotonou",4.6,1000
"Fidjrossè, Cotonou","Vèdoko, Cotonou",3.8,1000
"Fidjrossè, Cotonou","Haie Vive, Cotonou",3.9,1000
"Fidjrossè, Cotonou","Patte d'Oie, Cotonou",4.2,1000
"Fidjrossè, Cotonou","Cadjehoun, Cotonou",5.2,1200
"Fidjrossè, Cotonou","Sainte Rita, Cotonou",5.3,1200
"Fidjrossè, Cotonou","Zongo, Cotonou",5.3,1200
"Fidjrossè, Cotonou","Gbégamey, Cotonou",5.8,1200
"Fidjrossè, Cotonou","Étoile Rouge, Cotonou",5.8,1200
"Fidjrossè, Cotonou","Jéricho / Marocana, Cotonou",8.1,1500
"Fidjrossè, Cotonou","Dantokpa, Cotonou",9.2,1500
"Fidjrossè, Cotonou","Ganhi, Cotonou",9.3,1500
"Fidjrossè, Cotonou","Akpakpa Centre, Cotonou",12.3,1500
"Fidjrossè, Cotonou","Akpakpa Dodomè, Cotonou",12.7,1500
"Fidjrossè, Cotonou","Akpakpa PK3, Cotonou",14.5,1500
"Agla, Cotonou","Menontin, Cotonou",1.4,700
"Agla, Cotonou","Kouhounou, Cotonou",2.3,700
"Agla, Cotonou","Vèdoko, Cotonou",3.5,1000
"Agla, Cotonou","Haie Vive, Cotonou",6.8,1200
"Agla, Cotonou","Patte d'Oie, Cotonou",6.6,1200
"Agla, Cotonou","Cadjehoun, Cotonou",7.5,1200
"Agla, Cotonou","Sainte Rita, Cotonou",5.0,1000
"Agla, Cotonou","Zongo, Cotonou",7.1,1200
"Agla, Cotonou","Gbégamey, Cotonou",7.5,1200
"Agla, Cotonou","Étoile Rouge, Cotonou",6.8,1200
"Agla, Cotonou","Jéricho / Marocana, Cotonou",9.1,1500
"Agla, Cotonou","Dantokpa, Cotonou",10.3,1500
"Agla, Cotonou","Ganhi, Cotonou",11.3,1500
"Agla, Cotonou","Akpakpa Centre, Cotonou",13.6,1500
"Agla, Cotonou","Akpakpa Dodomè, Cotonou",14.4,1500
"Agla, Cotonou","Akpakpa PK3, Cotonou",15.6,1500
"Menontin, Cotonou","Kouhounou, Cotonou",2.0,700
"Menontin, Cotonou","Vèdoko, Cotonou",3.9,1000
"Menontin, Cotonou","Haie Vive, Cotonou",7.7,1200
"Menontin, Cotonou","Patte d'Oie, Cotonou",7.4,1200
"Menontin, Cotonou","Cadjehoun, Cotonou",8.1,1500
"Menontin, Cotonou","Sainte Rita, Cotonou",5.0,1000
"Menontin, Cotonou","Zongo, Cotonou",7.6,1200
"Menontin, Cotonou","Gbégamey, Cotonou",8.0,1200
"Menontin, Cotonou","Étoile Rouge, Cotonou",7.1,1200
"Menontin, Cotonou","Jéricho / Marocana, Cotonou",9.3,1500
"Menontin, Cotonou","Dantokpa, Cotonou",10.4,1500
"Menontin, Cotonou","Ganhi, Cotonou",11.7,1500
"Menontin, Cotonou","Akpakpa Centre, Cotonou",13.7,1500
"Menontin, Cotonou","Akpakpa Dodomè, Cotonou",14.7,1500
"Menontin, Cotonou","Akpakpa PK3, Cotonou",15.7,1500
"Kouhounou, Cotonou","Vèdoko, Cotonou",2.0,700
"Kouhounou, Cotonou","Haie Vive, Cotonou",6.1,1200
"Kouhounou, Cotonou","Patte d'Oie, Cotonou",5.7,1200
"Kouhounou, Cotonou","Cadjehoun, Cotonou",6.3,1200
"Kouhounou, Cotonou","Sainte Rita, Cotonou",2.9,1000
"Kouhounou, Cotonou","Zongo, Cotonou",5.7,1200
"Kouhounou, Cotonou","Gbégamey, Cotonou",6.0,1200
"Kouhounou, Cotonou","Étoile Rouge, Cotonou",5.1,1200
"Kouhounou, Cotonou","Jéricho / Marocana, Cotonou",7.2,1200
"Kouhounou, Cotonou","Dantokpa, Cotonou",8.4,1500
"Kouhounou, Cotonou","Ganhi, Cotonou",9.7,1500
"Kouhounou, Cotonou","Akpakpa Centre, Cotonou",11.7,1500
"Kouhounou, Cotonou","Akpakpa Dodomè, Cotonou",12.7,1500
"Kouhounou, Cotonou","Akpakpa PK3, Cotonou",13.7,1500
"Vèdoko, Cotonou","Haie Vive, Cotonou",4.2,1000
"Vèdoko, Cotonou","Patte d'Oie, Cotonou",3.8,1000
"Vèdoko, Cotonou","Cadjehoun, Cotonou",4.3,1000
"Vèdoko, Cotonou","Sainte Rita, Cotonou",1.7,700
"Vèdoko, Cotonou","Zongo, Cotonou",3.8,1000
"Vèdoko, Cotonou","Gbégamey, Cotonou",4.1,1000
"Vèdoko, Cotonou","Étoile Rouge, Cotonou",3.3,1000
"Vèdoko, Cotonou","Jéricho / Marocana, Cotonou",5.6,1200
"Vèdoko, Cotonou","Dantokpa, Cotonou",6.8,1200
"Vèdoko, Cotonou","Ganhi, Cotonou",7.9,1200
"Vèdoko, Cotonou","Akpakpa Centre, Cotonou",10.0,1500
"Vèdoko, Cotonou","Akpakpa Dodomè, Cotonou",10.9,1500
"Vèdoko, Cotonou","Akpakpa PK3, Cotonou",12.1,1500
"Haie Vive, Cotonou","Patte d'Oie, Cotonou",0.7,700
"Haie Vive, Cotonou","Cadjehoun, Cotonou",1.6,700
"Haie Vive, Cotonou","Sainte Rita, Cotonou",4.6,1000
"Haie Vive, Cotonou","Zongo, Cotonou",2.1,700
"Haie Vive, Cotonou","Gbégamey, Cotonou",2.6,1000
"Haie Vive, Cotonou","Étoile Rouge, Cotonou",3.3,1000
"Haie Vive, Cotonou","Jéricho / Marocana, Cotonou",5.0,1000
"Haie Vive, Cotonou","Dantokpa, Cotonou",6.0,1200
"Haie Vive, Cotonou","Ganhi, Cotonou",5.5,1200
"Haie Vive, Cotonou","Akpakpa Centre, Cotonou",8.8,1500
"Haie Vive, Cotonou","Akpakpa Dodomè, Cotonou",8.9,1500
"Haie Vive, Cotonou","Akpakpa PK3, Cotonou",11.0,1500
"Patte d'Oie, Cotonou","Cadjehoun, Cotonou",1.1,700
"Patte d'Oie, Cotonou","Sainte Rita, Cotonou",4.0,1000
"Patte d'Oie, Cotonou","Zongo, Cotonou",1.4,700
"Patte d'Oie, Cotonou","Gbégamey, Cotonou",1.9,700
"Patte d'Oie, Cotonou","Étoile Rouge, Cotonou",2.5,700
"Patte d'Oie, Cotonou","Jéricho / Marocana, Cotonou",4.3,1000
"Patte d'Oie, Cotonou","Dantokpa, Cotonou",5.4,1200
"Patte d'Oie, Cotonou","Ganhi, Cotonou",5.2,1200
"Patte d'Oie, Cotonou","Akpakpa Centre, Cotonou",8.3,1500
"Patte d'Oie, Cotonou","Akpakpa Dodomè, Cotonou",8.5,1500
"Patte d'Oie, Cotonou","Akpakpa PK3, Cotonou",10.5,1500
"Cadjehoun, Cotonou","Sainte Rita, Cotonou",4.1,1000
"Cadjehoun, Cotonou","Zongo, Cotonou",0.8,700
"Cadjehoun, Cotonou","Gbégamey, Cotonou",1.1,700
"Cadjehoun, Cotonou","Étoile Rouge, Cotonou",2.1,700
"Cadjehoun, Cotonou","Jéricho / Marocana, Cotonou",3.4,1000
"Cadjehoun, Cotonou","Dantokpa, Cotonou",4.4,1000
"Cadjehoun, Cotonou","Ganhi, Cotonou",4.1,1000
"Cadjehoun, Cotonou","Akpakpa Centre, Cotonou",7.3,1200
"Cadjehoun, Cotonou","Akpakpa Dodomè, Cotonou",7.5,1200
"Cadjehoun, Cotonou","Akpakpa PK3, Cotonou",9.4,1500
"Sainte Rita, Cotonou","Zongo, Cotonou",3.4,1000
"Sainte Rita, Cotonou","Gbégamey, Cotonou",3.5,1000
"Sainte Rita, Cotonou","Étoile Rouge, Cotonou",2.4,700
"Sainte Rita, Cotonou","Jéricho / Marocana, Cotonou",4.3,1000
"Sainte Rita, Cotonou","Dantokpa, Cotonou",5.5,1200
"Sainte Rita, Cotonou","Ganhi, Cotonou",6.9,1200
"Sainte Rita, Cotonou","Akpakpa Centre, Cotonou",8.7,1500
"Sainte Rita, Cotonou","Akpakpa Dodomè, Cotonou",9.8,1500
"Sainte Rita, Cotonou","Akpakpa PK3, Cotonou",10.7,1500
"Zongo, Cotonou","Gbégamey, Cotonou",0.6,700
"Zongo, Cotonou","Étoile Rouge, Cotonou",1.4,700
"Zongo, Cotonou","Jéricho / Marocana, Cotonou",3.0,1000
"Zongo, Cotonou","Dantokpa, Cotonou",4.0,1000
"Zongo, Cotonou","Ganhi, Cotonou",4.3,1000
"Zongo, Cotonou","Akpakpa Centre, Cotonou",7.1,1200
"Zongo, Cotonou","Akpakpa Dodomè, Cotonou",7.5,1200
"Zongo, Cotonou","Akpakpa PK3, Cotonou",9.2,1500
"Gbégamey, Cotonou","Étoile Rouge, Cotonou",1.2,700
"Gbégamey, Cotonou","Jéricho / Marocana, Cotonou",2.4,700
"Gbégamey, Cotonou","Dantokpa, Cotonou",3.5,1000
"Gbégamey, Cotonou","Ganhi, Cotonou",3.8,1000
"Gbégamey, Cotonou","Akpakpa Centre, Cotonou",6.5,1200
"Gbégamey, Cotonou","Akpakpa Dodomè, Cotonou",7.0,1200
"Gbégamey, Cotonou","Akpakpa PK3, Cotonou",8.7,1500
"Étoile Rouge, Cotonou","Jéricho / Marocana, Cotonou",2.4,700
"Étoile Rouge, Cotonou","Dantokpa, Cotonou",3.6,1000
"Étoile Rouge, Cotonou","Ganhi, Cotonou",4.6,1000
"Étoile Rouge, Cotonou","Akpakpa Centre, Cotonou",6.8,1200
"Étoile Rouge, Cotonou","Akpakpa Dodomè, Cotonou",7.6,1200
"Étoile Rouge, Cotonou","Akpakpa PK3, Cotonou",9.0,1500
"Jéricho / Marocana, Cotonou","Dantokpa, Cotonou",1.2,700
"Jéricho / Marocana, Cotonou","Ganhi, Cotonou",3.0,1000
"Jéricho / Marocana, Cotonou","Akpakpa Centre, Cotonou",4.5,1000
"Jéricho / Marocana, Cotonou","Akpakpa Dodomè, Cotonou",5.5,1200
"Jéricho / Marocana, Cotonou","Akpakpa PK3, Cotonou",6.6,1200
"Dantokpa, Cotonou","Ganhi, Cotonou",2.5,700
"Dantokpa, Cotonou","Akpakpa Centre, Cotonou",3.3,1000
"Dantokpa, Cotonou","Akpakpa Dodomè, Cotonou",4.5,1000
"Dantokpa, Cotonou","Akpakpa PK3, Cotonou",5.4,1200
"Ganhi, Cotonou","Akpakpa Centre, Cotonou",4.0,1000
"Ganhi, Cotonou","Akpakpa Dodomè, Cotonou",3.4,1000
"Ganhi, Cotonou","Akpakpa PK3, Cotonou",5.7,1200
"Akpakpa Centre, Cotonou","Akpakpa Dodomè, Cotonou",1.7,700
"Akpakpa Centre, Cotonou","Akpakpa PK3, Cotonou",2.2,700
"Akpakpa Dodomè, Cotonou","Akpakpa PK3, Cotonou",2.5,700
"Cococodji, Calavi","Godomey, Calavi",7.4,1200
"Cococodji, Calavi","Togoudo, Calavi",9.5,1200
"Cococodji, Calavi","Tankpè, Calavi",9.1,1200
"Cococodji, Calavi","IITA, Calavi",9.7,1200
"Cococodji, Calavi","UAC (campus), Calavi",11.6,1500
"Cococodji, Calavi","Womey, Calavi",13.1,1500
"Cococodji, Calavi","Calavi Kpota, Calavi",15.1,1500
"Cococodji, Calavi","Arconville, Calavi",17.5,1500
"Cococodji, Calavi","Zopah, Calavi",16.5,1500
"Cococodji, Calavi","Zoundja, Calavi",18.0,1500
"Cococodji, Calavi","Akassato, Calavi",22.0,1500
"Cococodji, Calavi","Zogbadjè, Calavi",22.7,1500
"Godomey, Calavi","Togoudo, Calavi",3.0,700
"Godomey, Calavi","Tankpè, Calavi",1.8,700
"Godomey, Calavi","IITA, Calavi",2.3,700
"Godomey, Calavi","UAC (campus), Calavi",4.6,1000
"Godomey, Calavi","Womey, Calavi",5.6,1000
"Godomey, Calavi","Calavi Kpota, Calavi",7.7,1200
"Godomey, Calavi","Arconville, Calavi",10.5,1200
"Godomey, Calavi","Zopah, Calavi",9.7,1200
"Godomey, Calavi","Zoundja, Calavi",13.3,1500
"Godomey, Calavi","Akassato, Calavi",15.3,1500
"Godomey, Calavi","Zogbadjè, Calavi",16.1,1500
"Togoudo, Calavi","Tankpè, Calavi",3.1,700
"Togoudo, Calavi","IITA, Calavi",2.1,700
"Togoudo, Calavi","UAC (campus), Calavi",2.2,700
"Togoudo, Calavi","Womey, Calavi",4.5,1000
"Togoudo, Calavi","Calavi Kpota, Calavi",7.0,1000
"Togoudo, Calavi","Arconville, Calavi",10.4,1200
"Togoudo, Calavi","Zopah, Calavi",10.0,1200
"Togoudo, Calavi","Zoundja, Calavi",14.9,1500
"Togoudo, Calavi","Akassato, Calavi",15.3,1500
"Togoudo, Calavi","Zogbadjè, Calavi",16.2,1500
"Tankpè, Calavi","IITA, Calavi",1.2,700
"Tankpè, Calavi","UAC (campus), Calavi",3.8,1000
"Tankpè, Calavi","Womey, Calavi",4.1,1000
"Tankpè, Calavi","Calavi Kpota, Calavi",6.0,1000
"Tankpè, Calavi","Arconville, Calavi",8.7,1200
"Tankpè, Calavi","Zopah, Calavi",8.0,1200
"Tankpè, Calavi","Zoundja, Calavi",12.0,1500
"Tankpè, Calavi","Akassato, Calavi",13.5,1500
"Tankpè, Calavi","Zogbadjè, Calavi",14.3,1500
"IITA, Calavi","UAC (campus), Calavi",2.7,700
"IITA, Calavi","Womey, Calavi",3.4,700
"IITA, Calavi","Calavi Kpota, Calavi",5.6,1000
"IITA, Calavi","Arconville, Calavi",8.7,1200
"IITA, Calavi","Zopah, Calavi",8.2,1200
"IITA, Calavi","Zoundja, Calavi",12.8,1500
"IITA, Calavi","Akassato, Calavi",13.6,1500
"IITA, Calavi","Zogbadjè, Calavi",14.5,1500
"UAC (campus), Calavi","Womey, Calavi",2.7,700
"UAC (campus), Calavi","Calavi Kpota, Calavi",5.2,1000
"UAC (campus), Calavi","Arconville, Calavi",8.8,1200
"UAC (campus), Calavi","Zopah, Calavi",8.7,1200
"UAC (campus), Calavi","Zoundja, Calavi",14.4,1500
"UAC (campus), Calavi","Akassato, Calavi",13.7,1500
"UAC (campus), Calavi","Zogbadjè, Calavi",14.6,1500
"Womey, Calavi","Calavi Kpota, Calavi",2.5,700
"Womey, Calavi","Arconville, Calavi",6.1,1000
"Womey, Calavi","Zopah, Calavi",6.0,1000
"Womey, Calavi","Zoundja, Calavi",12.0,1500
"Womey, Calavi","Akassato, Calavi",10.9,1200
"Womey, Calavi","Zogbadjè, Calavi",11.8,1500
"Calavi Kpota, Calavi","Arconville, Calavi",3.6,1000
"Calavi Kpota, Calavi","Zopah, Calavi",4.0,1000
"Calavi Kpota, Calavi","Zoundja, Calavi",10.5,1200
"Calavi Kpota, Calavi","Akassato, Calavi",8.4,1200
"Calavi Kpota, Calavi","Zogbadjè, Calavi",9.3,1200
"Arconville, Calavi","Zopah, Calavi",1.5,700
"Arconville, Calavi","Zoundja, Calavi",8.1,1200
"Arconville, Calavi","Akassato, Calavi",4.9,1000
"Arconville, Calavi","Zogbadjè, Calavi",5.8,1000
"Zopah, Calavi","Zoundja, Calavi",6.8,1000
"Zopah, Calavi","Akassato, Calavi",5.6,1000
"Zopah, Calavi","Zogbadjè, Calavi",6.3,1000
"Zoundja, Calavi","Akassato, Calavi",8.2,1200
"Zoundja, Calavi","Zogbadjè, Calavi",8.2,1200
"Akassato, Calavi","Zogbadjè, Calavi",0.9,700
"Fidjrossè, Cotonou","Cococodji, Calavi",15.5,1500
"Fidjrossè, Cotonou","Godomey, Calavi",11.7,1500
"Fidjrossè, Cotonou","Togoudo, Calavi",14.8,1500
"Fidjrossè, Cotonou","Tankpè, Calavi",13.5,1500
"Fidjrossè, Cotonou","IITA, Calavi",14.0,1500
"Fidjrossè, Cotonou","UAC (campus), Calavi",16.4,1500
"Fidjrossè, Cotonou","Womey, Calavi",17.4,1500
"Fidjrossè, Cotonou","Calavi Kpota, Calavi",19.5,1500
"Fidjrossè, Cotonou","Arconville, Calavi",22.2,2000
"Fidjrossè, Cotonou","Zopah, Calavi",21.5,2000
"Fidjrossè, Cotonou","Zoundja, Calavi",25.0,2000
"Fidjrossè, Cotonou","Akassato, Calavi",27.0,2500
"Fidjrossè, Cotonou","Zogbadjè, Calavi",27.8,2500
"Agla, Cotonou","Cococodji, Calavi",13.8,1500
"Agla, Cotonou","Godomey, Calavi",8.6,1500
"Agla, Cotonou","Togoudo, Calavi",11.6,1500
"Agla, Cotonou","Tankpè, Calavi",10.3,1500
"Agla, Cotonou","IITA, Calavi",10.9,1500
"Agla, Cotonou","UAC (campus), Calavi",13.2,1500
"Agla, Cotonou","Womey, Calavi",14.2,1500
"Agla, Cotonou","Calavi Kpota, Calavi",16.3,1500
"Agla, Cotonou","Arconville, Calavi",19.1,1500
"Agla, Cotonou","Zopah, Calavi",18.3,1500
"Agla, Cotonou","Zoundja, Calavi",21.9,2000
"Agla, Cotonou","Akassato, Calavi",23.8,2000
"Agla, Cotonou","Zogbadjè, Calavi",24.6,2000
"Menontin, Cotonou","Cococodji, Calavi",14.0,1500
"Menontin, Cotonou","Godomey, Calavi",8.2,1500
"Menontin, Cotonou","Togoudo, Calavi",11.2,1500
"Menontin, Cotonou","Tankpè, Calavi",9.9,1500
"Menontin, Cotonou","IITA, Calavi",10.4,1500
"Menontin, Cotonou","UAC (campus), Calavi",12.8,1500
"Menontin, Cotonou","Womey, Calavi",13.8,1500
"Menontin, Cotonou","Calavi Kpota, Calavi",15.9,1500
"Menontin, Cotonou","Arconville, Calavi",18.6,1500
"Menontin, Cotonou","Zopah, Calavi",17.9,1500
"Menontin, Cotonou","Zoundja, Calavi",21.4,2000
"Menontin, Cotonou","Akassato, Calavi",23.4,2000
"Menontin, Cotonou","Zogbadjè, Calavi",24.2,2000
"Kouhounou, Cotonou","Cococodji, Calavi",15.9,1500
"Kouhounou, Cotonou","Godomey, Calavi",10.2,1500
"Kouhounou, Cotonou","Togoudo, Calavi",13.2,1500
"Kouhounou, Cotonou","Tankpè, Calavi",12.0,1500
"Kouhounou, Cotonou","IITA, Calavi",12.5,1500
"Kouhounou, Cotonou","UAC (campus), Calavi",14.8,1500
"Kouhounou, Cotonou","Womey, Calavi",15.8,1500
"Kouhounou, Cotonou","Calavi Kpota, Calavi",17.9,1500
"Kouhounou, Cotonou","Arconville, Calavi",20.7,2000
"Kouhounou, Cotonou","Zopah, Calavi",19.9,1500
"Kouhounou, Cotonou","Zoundja, Calavi",23.5,2000
"Kouhounou, Cotonou","Akassato, Calavi",25.5,2000
"Kouhounou, Cotonou","Zogbadjè, Calavi",26.3,2500
"Vèdoko, Cotonou","Cococodji, Calavi",17.3,1500
"Vèdoko, Cotonou","Godomey, Calavi",12.0,1500
"Vèdoko, Cotonou","Togoudo, Calavi",15.0,1500
"Vèdoko, Cotonou","Tankpè, Calavi",13.7,1500
"Vèdoko, Cotonou","IITA, Calavi",14.2,1500
"Vèdoko, Cotonou","UAC (campus), Calavi",16.6,1500
"Vèdoko, Cotonou","Womey, Calavi",17.6,1500
"Vèdoko, Cotonou","Calavi Kpota, Calavi",19.7,1500
"Vèdoko, Cotonou","Arconville, Calavi",22.5,2000
"Vèdoko, Cotonou","Zopah, Calavi",21.7,2000
"Vèdoko, Cotonou","Zoundja, Calavi",25.3,2000
"Vèdoko, Cotonou","Akassato, Calavi",27.2,2500
"Vèdoko, Cotonou","Zogbadjè, Calavi",28.0,2500
"Haie Vive, Cotonou","Cococodji, Calavi",19.4,1500
"Haie Vive, Cotonou","Godomey, Calavi",15.3,1500
"Haie Vive, Cotonou","Togoudo, Calavi",18.3,1500
"Haie Vive, Cotonou","Tankpè, Calavi",17.0,1500
"Haie Vive, Cotonou","IITA, Calavi",17.5,1500
"Haie Vive, Cotonou","UAC (campus), Calavi",19.9,1500
"Haie Vive, Cotonou","Womey, Calavi",20.9,2000
"Haie Vive, Cotonou","Calavi Kpota, Calavi",23.0,2000
"Haie Vive, Cotonou","Arconville, Calavi",25.8,2000
"Haie Vive, Cotonou","Zopah, Calavi",25.0,2000
"Haie Vive, Cotonou","Zoundja, Calavi",28.5,2500
"Haie Vive, Cotonou","Akassato, Calavi",30.5,2500
"Haie Vive, Cotonou","Zogbadjè, Calavi",31.3,2500
"Patte d'Oie, Cotonou","Cococodji, Calavi",19.6,1500
"Patte d'Oie, Cotonou","Godomey, Calavi",15.2,1500
"Patte d'Oie, Cotonou","Togoudo, Calavi",18.2,1500
"Patte d'Oie, Cotonou","Tankpè, Calavi",17.0,1500
"Patte d'Oie, Cotonou","IITA, Calavi",17.5,1500
"Patte d'Oie, Cotonou","UAC (campus), Calavi",19.8,1500
"Patte d'Oie, Cotonou","Womey, Calavi",20.8,2000
"Patte d'Oie, Cotonou","Calavi Kpota, Calavi",22.9,2000
"Patte d'Oie, Cotonou","Arconville, Calavi",25.7,2000
"Patte d'Oie, Cotonou","Zopah, Calavi",24.9,2000
"Patte d'Oie, Cotonou","Zoundja, Calavi",28.5,2500
"Patte d'Oie, Cotonou","Akassato, Calavi",30.4,2500
"Patte d'Oie, Cotonou","Zogbadjè, Calavi",31.3,2500
"Cadjehoun, Cotonou","Cococodji, Calavi",20.6,2000
"Cadjehoun, Cotonou","Godomey, Calavi",16.0,1500
"Cadjehoun, Cotonou","Togoudo, Calavi",19.1,1500
"Cadjehoun, Cotonou","Tankpè, Calavi",17.8,1500
"Cadjehoun, Cotonou","IITA, Calavi",18.3,1500
"Cadjehoun, Cotonou","UAC (campus), Calavi",20.7,2000
"Cadjehoun, Cotonou","Womey, Calavi",21.7,2000
"Cadjehoun, Cotonou","Calavi Kpota, Calavi",23.8,2000
"Cadjehoun, Cotonou","Arconville, Calavi",26.5,2500
"Cadjehoun, Cotonou","Zopah, Calavi",25.8,2000
"Cadjehoun, Cotonou","Zoundja, Calavi",29.3,2500
"Cadjehoun, Cotonou","Akassato, Calavi",31.3,2500
"Cadjehoun, Cotonou","Zogbadjè, Calavi",32.1,3000
"Sainte Rita, Cotonou","Cococodji, Calavi",18.8,1500
"Sainte Rita, Cotonou","Godomey, Calavi",13.1,1500
"Sainte Rita, Cotonou","Togoudo, Calavi",16.1,1500
"Sainte Rita, Cotonou","Tankpè, Calavi",14.9,1500
"Sainte Rita, Cotonou","IITA, Calavi",15.4,1500
"Sainte Rita, Cotonou","UAC (campus), Calavi",17.8,1500
"Sainte Rita, Cotonou","Womey, Calavi",18.7,1500
"Sainte Rita, Cotonou","Calavi Kpota, Calavi",20.9,2000
"Sainte Rita, Cotonou","Arconville, Calavi",23.6,2000
"Sainte Rita, Cotonou","Zopah, Calavi",22.9,2000
"Sainte Rita, Cotonou","Zoundja, Calavi",26.4,2500
"Sainte Rita, Cotonou","Akassato, Calavi",28.4,2500
"Sainte Rita, Cotonou","Zogbadjè, Calavi",29.2,2500
"Zongo, Cotonou","Cococodji, Calavi",20.5,1500
"Zongo, Cotonou","Godomey, Calavi",15.7,1500
"Zongo, Cotonou","Togoudo, Calavi",18.7,1500
"Zongo, Cotonou","Tankpè, Calavi",17.4,1500
"Zongo, Cotonou","IITA, Calavi",17.9,1500
"Zongo, Cotonou","UAC (campus), Calavi",20.3,1500
"Zongo, Cotonou","Womey, Calavi",21.3,2000
"Zongo, Cotonou","Calavi Kpota, Calavi",23.4,2000
"Zongo, Cotonou","Arconville, Calavi",26.2,2500
"Zongo, Cotonou","Zopah, Calavi",25.4,2000
"Zongo, Cotonou","Zoundja, Calavi",29.0,2500
"Zongo, Cotonou","Akassato, Calavi",30.9,2500
"Zongo, Cotonou","Zogbadjè, Calavi",31.7,3000
"Gbégamey, Cotonou","Cococodji, Calavi",21.0,2000
"Gbégamey, Cotonou","Godomey, Calavi",16.1,1500
"Gbégamey, Cotonou","Togoudo, Calavi",19.1,1500
"Gbégamey, Cotonou","Tankpè, Calavi",17.8,1500
"Gbégamey, Cotonou","IITA, Calavi",18.3,1500
"Gbégamey, Cotonou","UAC (campus), Calavi",20.7,2000
"Gbégamey, Cotonou","Womey, Calavi",21.7,2000
"Gbégamey, Cotonou","Calavi Kpota, Calavi",23.8,2000
"Gbégamey, Cotonou","Arconville, Calavi",26.5,2500
"Gbégamey, Cotonou","Zopah, Calavi",25.8,2000
"Gbégamey, Cotonou","Zoundja, Calavi",29.3,2500
"Gbégamey, Cotonou","Akassato, Calavi",31.3,2500
"Gbégamey, Cotonou","Zogbadjè, Calavi",32.1,3000
"Étoile Rouge, Cotonou","Cococodji, Calavi",20.5,1500
"Étoile Rouge, Cotonou","Godomey, Calavi",15.2,1500
"Étoile Rouge, Cotonou","Togoudo, Calavi",18.3,1500
"Étoile Rouge, Cotonou","Tankpè, Calavi",17.0,1500
"Étoile Rouge, Cotonou","IITA, Calavi",17.5,1500
"Étoile Rouge, Cotonou","UAC (campus), Calavi",19.9,1500
"Étoile Rouge, Cotonou","Womey, Calavi",20.9,2000
"Étoile Rouge, Cotonou","Calavi Kpota, Calavi",23.0,2000
"Étoile Rouge, Cotonou","Arconville, Calavi",25.7,2000
"Étoile Rouge, Cotonou","Zopah, Calavi",25.0,2000
"Étoile Rouge, Cotonou","Zoundja, Calavi",28.5,2500
"Étoile Rouge, Cotonou","Akassato, Calavi",30.5,2500
"Étoile Rouge, Cotonou","Zogbadjè, Calavi",31.3,2500
"Jéricho / Marocana, Cotonou","Cococodji, Calavi",22.8,2000
"Jéricho / Marocana, Cotonou","Godomey, Calavi",17.4,1500
"Jéricho / Marocana, Cotonou","Togoudo, Calavi",20.4,1500
"Jéricho / Marocana, Cotonou","Tankpè, Calavi",19.2,1500
"Jéricho / Marocana, Cotonou","IITA, Calavi",19.7,1500
"Jéricho / Marocana, Cotonou","UAC (campus), Calavi",22.0,2000
"Jéricho / Marocana, Cotonou","Womey, Calavi",23.0,2000
"Jéricho / Marocana, Cotonou","Calavi Kpota, Calavi",25.1,2000
"Jéricho / Marocana, Cotonou","Arconville, Calavi",27.9,2500
"Jéricho / Marocana, Cotonou","Zopah, Calavi",27.1,2500
"Jéricho / Marocana, Cotonou","Zoundja, Calavi",30.7,2500
"Jéricho / Marocana, Cotonou","Akassato, Calavi",32.7,3000
"Jéricho / Marocana, Cotonou","Zogbadjè, Calavi",33.5,3000
"Dantokpa, Cotonou","Cococodji, Calavi",24.1,2000
"Dantokpa, Cotonou","Godomey, Calavi",18.6,1500
"Dantokpa, Cotonou","Togoudo, Calavi",21.6,2000
"Dantokpa, Cotonou","Tankpè, Calavi",20.3,1500
"Dantokpa, Cotonou","IITA, Calavi",20.9,2000
"Dantokpa, Cotonou","UAC (campus), Calavi",23.2,2000
"Dantokpa, Cotonou","Womey, Calavi",24.2,2000
"Dantokpa, Cotonou","Calavi Kpota, Calavi",26.3,2500
"Dantokpa, Cotonou","Arconville, Calavi",29.1,2500
"Dantokpa, Cotonou","Zopah, Calavi",28.3,2500
"Dantokpa, Cotonou","Zoundja, Calavi",31.9,3000
"Dantokpa, Cotonou","Akassato, Calavi",33.8,3000
"Dantokpa, Cotonou","Zogbadjè, Calavi",34.6,3000
"Ganhi, Cotonou","Cococodji, Calavi",24.7,2000
"Ganhi, Cotonou","Godomey, Calavi",19.8,1500
"Ganhi, Cotonou","Togoudo, Calavi",22.9,2000
"Ganhi, Cotonou","Tankpè, Calavi",21.6,2000
"Ganhi, Cotonou","IITA, Calavi",22.1,2000
"Ganhi, Cotonou","UAC (campus), Calavi",24.5,2000
"Ganhi, Cotonou","Womey, Calavi",25.5,2000
"Ganhi, Cotonou","Calavi Kpota, Calavi",27.6,2500
"Ganhi, Cotonou","Arconville, Calavi",30.3,2500
"Ganhi, Cotonou","Zopah, Calavi",29.6,2500
"Ganhi, Cotonou","Zoundja, Calavi",33.1,3000
"Ganhi, Cotonou","Akassato, Calavi",35.1,3000
"Ganhi, Cotonou","Zogbadjè, Calavi",35.9,3000
"Akpakpa Centre, Cotonou","Cococodji, Calavi",27.3,2500
"Akpakpa Centre, Cotonou","Godomey, Calavi",21.8,2000
"Akpakpa Centre, Cotonou","Togoudo, Calavi",24.9,2000
"Akpakpa Centre, Cotonou","Tankpè, Calavi",23.6,2000
"Akpakpa Centre, Cotonou","IITA, Calavi",24.1,2000
"Akpakpa Centre, Cotonou","UAC (campus), Calavi",26.5,2500
"Akpakpa Centre, Cotonou","Womey, Calavi",27.5,2500
"Akpakpa Centre, Cotonou","Calavi Kpota, Calavi",29.6,2500
"Akpakpa Centre, Cotonou","Arconville, Calavi",32.3,3000
"Akpakpa Centre, Cotonou","Zopah, Calavi",31.6,3000
"Akpakpa Centre, Cotonou","Zoundja, Calavi",35.1,3000
"Akpakpa Centre, Cotonou","Akassato, Calavi",37.1,3000
"Akpakpa Centre, Cotonou","Zogbadjè, Calavi",37.9,3000
"Akpakpa Dodomè, Cotonou","Cococodji, Calavi",28.0,2500
"Akpakpa Dodomè, Cotonou","Godomey, Calavi",22.9,2000
"Akpakpa Dodomè, Cotonou","Togoudo, Calavi",25.9,2000
"Akpakpa Dodomè, Cotonou","Tankpè, Calavi",24.6,2000
"Akpakpa Dodomè, Cotonou","IITA, Calavi",25.1,2000
"Akpakpa Dodomè, Cotonou","UAC (campus), Calavi",27.5,2500
"Akpakpa Dodomè, Cotonou","Womey, Calavi",28.5,2500
"Akpakpa Dodomè, Cotonou","Calavi Kpota, Calavi",30.6,2500
"Akpakpa Dodomè, Cotonou","Arconville, Calavi",33.4,3000
"Akpakpa Dodomè, Cotonou","Zopah, Calavi",32.6,3000
"Akpakpa Dodomè, Cotonou","Zoundja, Calavi",36.1,3000
"Akpakpa Dodomè, Cotonou","Akassato, Calavi",38.1,3000
"Akpakpa Dodomè, Cotonou","Zogbadjè, Calavi",38.9,3000
"Akpakpa PK3, Cotonou","Cococodji, Calavi",29.4,2500
"Akpakpa PK3, Cotonou","Godomey, Calavi",23.8,2000
"Akpakpa PK3, Cotonou","Togoudo, Calavi",26.9,2500
"Akpakpa PK3, Cotonou","Tankpè, Calavi",25.6,2000
"Akpakpa PK3, Cotonou","IITA, Calavi",26.1,2500
"Akpakpa PK3, Cotonou","UAC (campus), Calavi",28.5,2500
"Akpakpa PK3, Cotonou","Womey, Calavi",29.5,2500
"Akpakpa PK3, Cotonou","Calavi Kpota, Calavi",31.6,3000
"Akpakpa PK3, Cotonou","Arconville, Calavi",34.3,3000
"Akpakpa PK3, Cotonou","Zopah, Calavi",33.6,3000
"Akpakpa PK3, Cotonou","Zoundja, Calavi",37.1,3000
"Akpakpa PK3, Cotonou","Akassato, Calavi",39.1,3000
"Akpakpa PK3, Cotonou","Zogbadjè, Calavi",39.9,3000
"Fidjrossè, Cotonou","Djassin, Porto-Novo",37.3,3500
"Fidjrossè, Cotonou","Houinmè, Porto-Novo",39.0,3500
"Fidjrossè, Cotonou","Louho, Porto-Novo",36.4,3500
"Fidjrossè, Cotonou","Tokpota, Porto-Novo",38.6,3500
"Fidjrossè, Cotonou","Dowa, Porto-Novo",39.2,4000
"Fidjrossè, Cotonou","Ouando, Porto-Novo",40.4,4000
"Fidjrossè, Cotonou","Agbokou (centre), Porto-Novo",41.3,4000
"Fidjrossè, Cotonou","Attakè, Porto-Novo",40.3,4000
"Fidjrossè, Cotonou","Akron, Porto-Novo",40.0,4000
"Fidjrossè, Cotonou","Gbèçon, Porto-Novo",40.2,4000
"Fidjrossè, Cotonou","Zounkpa, Porto-Novo",42.9,4000
"Agla, Cotonou","Djassin, Porto-Novo",38.4,3500
"Agla, Cotonou","Houinmè, Porto-Novo",40.0,4000
"Agla, Cotonou","Louho, Porto-Novo",37.5,3500
"Agla, Cotonou","Tokpota, Porto-Novo",39.7,4000
"Agla, Cotonou","Dowa, Porto-Novo",40.3,4000
"Agla, Cotonou","Ouando, Porto-Novo",41.4,4000
"Agla, Cotonou","Agbokou (centre), Porto-Novo",42.4,4000
"Agla, Cotonou","Attakè, Porto-Novo",41.4,4000
"Agla, Cotonou","Akron, Porto-Novo",41.0,4000
"Agla, Cotonou","Gbèçon, Porto-Novo",41.3,4000
"Agla, Cotonou","Zounkpa, Porto-Novo",43.9,4000
"Menontin, Cotonou","Djassin, Porto-Novo",38.5,3500
"Menontin, Cotonou","Houinmè, Porto-Novo",40.1,4000
"Menontin, Cotonou","Louho, Porto-Novo",37.6,3500
"Menontin, Cotonou","Tokpota, Porto-Novo",39.8,4000
"Menontin, Cotonou","Dowa, Porto-Novo",40.3,4000
"Menontin, Cotonou","Ouando, Porto-Novo",41.5,4000
"Menontin, Cotonou","Agbokou (centre), Porto-Novo",42.4,4000
"Menontin, Cotonou","Attakè, Porto-Novo",41.4,4000
"Menontin, Cotonou","Akron, Porto-Novo",41.1,4000
"Menontin, Cotonou","Gbèçon, Porto-Novo",41.4,4000
"Menontin, Cotonou","Zounkpa, Porto-Novo",44.0,4000
"Kouhounou, Cotonou","Djassin, Porto-Novo",36.6,3500
"Kouhounou, Cotonou","Houinmè, Porto-Novo",38.2,3500
"Kouhounou, Cotonou","Louho, Porto-Novo",35.7,3500
"Kouhounou, Cotonou","Tokpota, Porto-Novo",37.9,3500
"Kouhounou, Cotonou","Dowa, Porto-Novo",38.4,3500
"Kouhounou, Cotonou","Ouando, Porto-Novo",39.6,4000
"Kouhounou, Cotonou","Agbokou (centre), Porto-Novo",40.6,4000
"Kouhounou, Cotonou","Attakè, Porto-Novo",39.6,4000
"Kouhounou, Cotonou","Akron, Porto-Novo",39.2,4000
"Kouhounou, Cotonou","Gbèçon, Porto-Novo",39.5,4000
"Kouhounou, Cotonou","Zounkpa, Porto-Novo",42.1,4000
"Vèdoko, Cotonou","Djassin, Porto-Novo",35.2,3500
"Vèdoko, Cotonou","Houinmè, Porto-Novo",36.8,3500
"Vèdoko, Cotonou","Louho, Porto-Novo",34.3,3500
"Vèdoko, Cotonou","Tokpota, Porto-Novo",36.5,3500
"Vèdoko, Cotonou","Dowa, Porto-Novo",37.0,3500
"Vèdoko, Cotonou","Ouando, Porto-Novo",38.2,3500
"Vèdoko, Cotonou","Agbokou (centre), Porto-Novo",39.1,4000
"Vèdoko, Cotonou","Attakè, Porto-Novo",38.1,3500
"Vèdoko, Cotonou","Akron, Porto-Novo",37.8,3500
"Vèdoko, Cotonou","Gbèçon, Porto-Novo",38.1,3500
"Vèdoko, Cotonou","Zounkpa, Porto-Novo",40.7,4000
"Haie Vive, Cotonou","Djassin, Porto-Novo",34.1,3500
"Haie Vive, Cotonou","Houinmè, Porto-Novo",35.7,3500
"Haie Vive, Cotonou","Louho, Porto-Novo",33.2,3500
"Haie Vive, Cotonou","Tokpota, Porto-Novo",35.4,3500
"Haie Vive, Cotonou","Dowa, Porto-Novo",36.0,3500
"Haie Vive, Cotonou","Ouando, Porto-Novo",37.1,3500
"Haie Vive, Cotonou","Agbokou (centre), Porto-Novo",38.1,3500
"Haie Vive, Cotonou","Attakè, Porto-Novo",37.1,3500
"Haie Vive, Cotonou","Akron, Porto-Novo",36.7,3500
"Haie Vive, Cotonou","Gbèçon, Porto-Novo",37.0,3500
"Haie Vive, Cotonou","Zounkpa, Porto-Novo",39.6,4000
"Patte d'Oie, Cotonou","Djassin, Porto-Novo",33.6,3500
"Patte d'Oie, Cotonou","Houinmè, Porto-Novo",35.3,3500
"Patte d'Oie, Cotonou","Louho, Porto-Novo",32.7,3000
"Patte d'Oie, Cotonou","Tokpota, Porto-Novo",34.9,3500
"Patte d'Oie, Cotonou","Dowa, Porto-Novo",35.5,3500
"Patte d'Oie, Cotonou","Ouando, Porto-Novo",36.6,3500
"Patte d'Oie, Cotonou","Agbokou (centre), Porto-Novo",37.6,3500
"Patte d'Oie, Cotonou","Attakè, Porto-Novo",36.6,3500
"Patte d'Oie, Cotonou","Akron, Porto-Novo",36.3,3500
"Patte d'Oie, Cotonou","Gbèçon, Porto-Novo",36.5,3500
"Patte d'Oie, Cotonou","Zounkpa, Porto-Novo",39.2,4000
"Cadjehoun, Cotonou","Djassin, Porto-Novo",32.6,3000
"Cadjehoun, Cotonou","Houinmè, Porto-Novo",34.3,3500
"Cadjehoun, Cotonou","Louho, Porto-Novo",31.7,3000
"Cadjehoun, Cotonou","Tokpota, Porto-Novo",33.9,3500
"Cadjehoun, Cotonou","Dowa, Porto-Novo",34.5,3500
"Cadjehoun, Cotonou","Ouando, Porto-Novo",35.7,3500
"Cadjehoun, Cotonou","Agbokou (centre), Porto-Novo",36.6,3500
"Cadjehoun, Cotonou","Attakè, Porto-Novo",35.6,3500
"Cadjehoun, Cotonou","Akron, Porto-Novo",35.3,3500
"Cadjehoun, Cotonou","Gbèçon, Porto-Novo",35.5,3500
"Cadjehoun, Cotonou","Zounkpa, Porto-Novo",38.2,3500
"Sainte Rita, Cotonou","Djassin, Porto-Novo",33.9,3500
"Sainte Rita, Cotonou","Houinmè, Porto-Novo",35.5,3500
"Sainte Rita, Cotonou","Louho, Porto-Novo",33.0,3000
"Sainte Rita, Cotonou","Tokpota, Porto-Novo",35.2,3500
"Sainte Rita, Cotonou","Dowa, Porto-Novo",35.7,3500
"Sainte Rita, Cotonou","Ouando, Porto-Novo",36.9,3500
"Sainte Rita, Cotonou","Agbokou (centre), Porto-Novo",37.8,3500
"Sainte Rita, Cotonou","Attakè, Porto-Novo",36.9,3500
"Sainte Rita, Cotonou","Akron, Porto-Novo",36.5,3500
"Sainte Rita, Cotonou","Gbèçon, Porto-Novo",36.8,3500
"Sainte Rita, Cotonou","Zounkpa, Porto-Novo",39.4,4000
"Zongo, Cotonou","Djassin, Porto-Novo",32.5,3000
"Zongo, Cotonou","Houinmè, Porto-Novo",34.1,3500
"Zongo, Cotonou","Louho, Porto-Novo",31.6,3000
"Zongo, Cotonou","Tokpota, Porto-Novo",33.8,3500
"Zongo, Cotonou","Dowa, Porto-Novo",34.4,3500
"Zongo, Cotonou","Ouando, Porto-Novo",35.5,3500
"Zongo, Cotonou","Agbokou (centre), Porto-Novo",36.5,3500
"Zongo, Cotonou","Attakè, Porto-Novo",35.5,3500
"Zongo, Cotonou","Akron, Porto-Novo",35.1,3500
"Zongo, Cotonou","Gbèçon, Porto-Novo",35.4,3500
"Zongo, Cotonou","Zounkpa, Porto-Novo",38.0,3500
"Gbégamey, Cotonou","Djassin, Porto-Novo",32.0,3000
"Gbégamey, Cotonou","Houinmè, Porto-Novo",33.6,3500
"Gbégamey, Cotonou","Louho, Porto-Novo",31.1,3000
"Gbégamey, Cotonou","Tokpota, Porto-Novo",33.3,3500
"Gbégamey, Cotonou","Dowa, Porto-Novo",33.8,3500
"Gbégamey, Cotonou","Ouando, Porto-Novo",35.0,3500
"Gbégamey, Cotonou","Agbokou (centre), Porto-Novo",36.0,3500
"Gbégamey, Cotonou","Attakè, Porto-Novo",35.0,3500
"Gbégamey, Cotonou","Akron, Porto-Novo",34.6,3500
"Gbégamey, Cotonou","Gbèçon, Porto-Novo",34.9,3500
"Gbégamey, Cotonou","Zounkpa, Porto-Novo",37.5,3500
"Étoile Rouge, Cotonou","Djassin, Porto-Novo",32.2,3000
"Étoile Rouge, Cotonou","Houinmè, Porto-Novo",33.9,3500
"Étoile Rouge, Cotonou","Louho, Porto-Novo",31.3,3000
"Étoile Rouge, Cotonou","Tokpota, Porto-Novo",33.5,3500
"Étoile Rouge, Cotonou","Dowa, Porto-Novo",34.1,3500
"Étoile Rouge, Cotonou","Ouando, Porto-Novo",35.2,3500
"Étoile Rouge, Cotonou","Agbokou (centre), Porto-Novo",36.2,3500
"Étoile Rouge, Cotonou","Attakè, Porto-Novo",35.2,3500
"Étoile Rouge, Cotonou","Akron, Porto-Novo",34.9,3500
"Étoile Rouge, Cotonou","Gbèçon, Porto-Novo",35.1,3500
"Étoile Rouge, Cotonou","Zounkpa, Porto-Novo",37.8,3500
"Jéricho / Marocana, Cotonou","Djassin, Porto-Novo",30.0,3000
"Jéricho / Marocana, Cotonou","Houinmè, Porto-Novo",31.7,3000
"Jéricho / Marocana, Cotonou","Louho, Porto-Novo",29.1,3000
"Jéricho / Marocana, Cotonou","Tokpota, Porto-Novo",31.3,3000
"Jéricho / Marocana, Cotonou","Dowa, Porto-Novo",31.9,3000
"Jéricho / Marocana, Cotonou","Ouando, Porto-Novo",33.0,3000
"Jéricho / Marocana, Cotonou","Agbokou (centre), Porto-Novo",34.0,3500
"Jéricho / Marocana, Cotonou","Attakè, Porto-Novo",33.0,3000
"Jéricho / Marocana, Cotonou","Akron, Porto-Novo",32.7,3000
"Jéricho / Marocana, Cotonou","Gbèçon, Porto-Novo",32.9,3000
"Jéricho / Marocana, Cotonou","Zounkpa, Porto-Novo",35.6,3500
"Dantokpa, Cotonou","Djassin, Porto-Novo",28.9,3000
"Dantokpa, Cotonou","Houinmè, Porto-Novo",30.6,3000
"Dantokpa, Cotonou","Louho, Porto-Novo",28.0,3000
"Dantokpa, Cotonou","Tokpota, Porto-Novo",30.2,3000
"Dantokpa, Cotonou","Dowa, Porto-Novo",30.8,3000
"Dantokpa, Cotonou","Ouando, Porto-Novo",31.9,3000
"Dantokpa, Cotonou","Agbokou (centre), Porto-Novo",32.9,3000
"Dantokpa, Cotonou","Attakè, Porto-Novo",31.9,3000
"Dantokpa, Cotonou","Akron, Porto-Novo",31.6,3000
"Dantokpa, Cotonou","Gbèçon, Porto-Novo",31.8,3000
"Dantokpa, Cotonou","Zounkpa, Porto-Novo",34.5,3500
"Ganhi, Cotonou","Djassin, Porto-Novo",29.3,3000
"Ganhi, Cotonou","Houinmè, Porto-Novo",30.9,3000
"Ganhi, Cotonou","Louho, Porto-Novo",28.4,3000
"Ganhi, Cotonou","Tokpota, Porto-Novo",30.6,3000
"Ganhi, Cotonou","Dowa, Porto-Novo",31.1,3000
"Ganhi, Cotonou","Ouando, Porto-Novo",32.3,3000
"Ganhi, Cotonou","Agbokou (centre), Porto-Novo",33.2,3500
"Ganhi, Cotonou","Attakè, Porto-Novo",32.2,3000
"Ganhi, Cotonou","Akron, Porto-Novo",31.9,3000
"Ganhi, Cotonou","Gbèçon, Porto-Novo",32.2,3000
"Ganhi, Cotonou","Zounkpa, Porto-Novo",34.8,3500
"Akpakpa Centre, Cotonou","Djassin, Porto-Novo",25.8,3000
"Akpakpa Centre, Cotonou","Houinmè, Porto-Novo",27.5,3000
"Akpakpa Centre, Cotonou","Louho, Porto-Novo",24.9,3000
"Akpakpa Centre, Cotonou","Tokpota, Porto-Novo",27.1,3000
"Akpakpa Centre, Cotonou","Dowa, Porto-Novo",27.7,3000
"Akpakpa Centre, Cotonou","Ouando, Porto-Novo",28.9,3000
"Akpakpa Centre, Cotonou","Agbokou (centre), Porto-Novo",29.8,3000
"Akpakpa Centre, Cotonou","Attakè, Porto-Novo",28.8,3000
"Akpakpa Centre, Cotonou","Akron, Porto-Novo",28.5,3000
"Akpakpa Centre, Cotonou","Gbèçon, Porto-Novo",28.8,3000
"Akpakpa Centre, Cotonou","Zounkpa, Porto-Novo",31.4,3000
"Akpakpa Dodomè, Cotonou","Djassin, Porto-Novo",26.2,3000
"Akpakpa Dodomè, Cotonou","Houinmè, Porto-Novo",27.8,3000
"Akpakpa Dodomè, Cotonou","Louho, Porto-Novo",25.3,3000
"Akpakpa Dodomè, Cotonou","Tokpota, Porto-Novo",27.5,3000
"Akpakpa Dodomè, Cotonou","Dowa, Porto-Novo",28.1,3000
"Akpakpa Dodomè, Cotonou","Ouando, Porto-Novo",29.2,3000
"Akpakpa Dodomè, Cotonou","Agbokou (centre), Porto-Novo",30.2,3000
"Akpakpa Dodomè, Cotonou","Attakè, Porto-Novo",29.2,3000
"Akpakpa Dodomè, Cotonou","Akron, Porto-Novo",28.8,3000
"Akpakpa Dodomè, Cotonou","Gbèçon, Porto-Novo",29.1,3000
"Akpakpa Dodomè, Cotonou","Zounkpa, Porto-Novo",31.7,3000
"Akpakpa PK3, Cotonou","Djassin, Porto-Novo",23.8,3000
"Akpakpa PK3, Cotonou","Houinmè, Porto-Novo",25.5,3000
"Akpakpa PK3, Cotonou","Louho, Porto-Novo",22.9,3000
"Akpakpa PK3, Cotonou","Tokpota, Porto-Novo",25.1,3000
"Akpakpa PK3, Cotonou","Dowa, Porto-Novo",25.7,3000
"Akpakpa PK3, Cotonou","Ouando, Porto-Novo",26.9,3000
"Akpakpa PK3, Cotonou","Agbokou (centre), Porto-Novo",27.8,3000
"Akpakpa PK3, Cotonou","Attakè, Porto-Novo",26.8,3000
"Akpakpa PK3, Cotonou","Akron, Porto-Novo",26.5,3000
"Akpakpa PK3, Cotonou","Gbèçon, Porto-Novo",26.7,3000
"Akpakpa PK3, Cotonou","Zounkpa, Porto-Novo",29.4,3000
"Fidjrossè, Cotonou","Avlékété, Ouidah",23.4,4000
"Fidjrossè, Cotonou","Tovè, Ouidah",35.4,5000
"Fidjrossè, Cotonou","Centre-ville (Place Chacha), Ouidah",37.2,5000
"Fidjrossè, Cotonou","Kpassè, Ouidah",36.2,5000
"Fidjrossè, Cotonou","Zoungbodji, Ouidah",37.2,5000
"Fidjrossè, Cotonou","Savi, Ouidah",35.4,5000
"Fidjrossè, Cotonou","Gakpè, Ouidah",31.6,4500
"Fidjrossè, Cotonou","Djègbadji, Ouidah",38.5,5000
"Fidjrossè, Cotonou","Houakpè-Daho, Ouidah",44.9,5500
"Agla, Cotonou","Avlékété, Ouidah",21.9,4000
"Agla, Cotonou","Tovè, Ouidah",33.9,4500
"Agla, Cotonou","Centre-ville (Place Chacha), Ouidah",35.6,5000
"Agla, Cotonou","Kpassè, Ouidah",34.7,4500
"Agla, Cotonou","Zoungbodji, Ouidah",35.7,5000
"Agla, Cotonou","Savi, Ouidah",33.9,4500
"Agla, Cotonou","Gakpè, Ouidah",30.1,4500
"Agla, Cotonou","Djègbadji, Ouidah",36.9,5000
"Agla, Cotonou","Houakpè-Daho, Ouidah",43.3,5500
"Menontin, Cotonou","Avlékété, Ouidah",22.0,4000
"Menontin, Cotonou","Tovè, Ouidah",34.0,4500
"Menontin, Cotonou","Centre-ville (Place Chacha), Ouidah",35.8,5000
"Menontin, Cotonou","Kpassè, Ouidah",34.9,4500
"Menontin, Cotonou","Zoungbodji, Ouidah",35.9,5000
"Menontin, Cotonou","Savi, Ouidah",34.0,4500
"Menontin, Cotonou","Gakpè, Ouidah",30.2,4500
"Menontin, Cotonou","Djègbadji, Ouidah",37.1,5000
"Menontin, Cotonou","Houakpè-Daho, Ouidah",43.5,5500
"Kouhounou, Cotonou","Avlékété, Ouidah",23.7,4000
"Kouhounou, Cotonou","Tovè, Ouidah",35.7,5000
"Kouhounou, Cotonou","Centre-ville (Place Chacha), Ouidah",37.5,5000
"Kouhounou, Cotonou","Kpassè, Ouidah",36.6,5000
"Kouhounou, Cotonou","Zoungbodji, Ouidah",37.6,5000
"Kouhounou, Cotonou","Savi, Ouidah",35.7,5000
"Kouhounou, Cotonou","Gakpè, Ouidah",31.9,4500
"Kouhounou, Cotonou","Djègbadji, Ouidah",38.8,5000
"Kouhounou, Cotonou","Houakpè-Daho, Ouidah",45.2,5500
"Vèdoko, Cotonou","Avlékété, Ouidah",25.0,4000
"Vèdoko, Cotonou","Tovè, Ouidah",36.9,5000
"Vèdoko, Cotonou","Centre-ville (Place Chacha), Ouidah",38.7,5000
"Vèdoko, Cotonou","Kpassè, Ouidah",37.8,5000
"Vèdoko, Cotonou","Zoungbodji, Ouidah",38.8,5000
"Vèdoko, Cotonou","Savi, Ouidah",36.9,5000
"Vèdoko, Cotonou","Gakpè, Ouidah",33.2,4500
"Vèdoko, Cotonou","Djègbadji, Ouidah",40.0,5000
"Vèdoko, Cotonou","Houakpè-Daho, Ouidah",46.4,5500
"Haie Vive, Cotonou","Avlékété, Ouidah",26.9,4000
"Haie Vive, Cotonou","Tovè, Ouidah",38.8,5000
"Haie Vive, Cotonou","Centre-ville (Place Chacha), Ouidah",40.6,5000
"Haie Vive, Cotonou","Kpassè, Ouidah",39.7,5000
"Haie Vive, Cotonou","Zoungbodji, Ouidah",40.7,5000
"Haie Vive, Cotonou","Savi, Ouidah",38.8,5000
"Haie Vive, Cotonou","Gakpè, Ouidah",35.1,5000
"Haie Vive, Cotonou","Djègbadji, Ouidah",41.9,5500
"Haie Vive, Cotonou","Houakpè-Daho, Ouidah",48.3,6000
"Patte d'Oie, Cotonou","Avlékété, Ouidah",27.0,4000
"Patte d'Oie, Cotonou","Tovè, Ouidah",39.0,5000
"Patte d'Oie, Cotonou","Centre-ville (Place Chacha), Ouidah",40.8,5000
"Patte d'Oie, Cotonou","Kpassè, Ouidah",39.8,5000
"Patte d'Oie, Cotonou","Zoungbodji, Ouidah",40.9,5000
"Patte d'Oie, Cotonou","Savi, Ouidah",39.0,5000
"Patte d'Oie, Cotonou","Gakpè, Ouidah",35.2,5000
"Patte d'Oie, Cotonou","Djègbadji, Ouidah",42.1,5500
"Patte d'Oie, Cotonou","Houakpè-Daho, Ouidah",48.5,6000
"Cadjehoun, Cotonou","Avlékété, Ouidah",27.9,4000
"Cadjehoun, Cotonou","Tovè, Ouidah",39.9,5000
"Cadjehoun, Cotonou","Centre-ville (Place Chacha), Ouidah",41.7,5500
"Cadjehoun, Cotonou","Kpassè, Ouidah",40.7,5000
"Cadjehoun, Cotonou","Zoungbodji, Ouidah",41.8,5500
"Cadjehoun, Cotonou","Savi, Ouidah",39.9,5000
"Cadjehoun, Cotonou","Gakpè, Ouidah",36.1,5000
"Cadjehoun, Cotonou","Djègbadji, Ouidah",43.0,5500
"Cadjehoun, Cotonou","Houakpè-Daho, Ouidah",49.4,6000
"Sainte Rita, Cotonou","Avlékété, Ouidah",26.3,4000
"Sainte Rita, Cotonou","Tovè, Ouidah",38.2,5000
"Sainte Rita, Cotonou","Centre-ville (Place Chacha), Ouidah",40.0,5000
"Sainte Rita, Cotonou","Kpassè, Ouidah",39.1,5000
"Sainte Rita, Cotonou","Zoungbodji, Ouidah",40.1,5000
"Sainte Rita, Cotonou","Savi, Ouidah",38.3,5000
"Sainte Rita, Cotonou","Gakpè, Ouidah",34.5,4500
"Sainte Rita, Cotonou","Djègbadji, Ouidah",41.3,5500
"Sainte Rita, Cotonou","Houakpè-Daho, Ouidah",47.7,6000
"Zongo, Cotonou","Avlékété, Ouidah",27.8,4000
"Zongo, Cotonou","Tovè, Ouidah",39.8,5000
"Zongo, Cotonou","Centre-ville (Place Chacha), Ouidah",41.5,5500
"Zongo, Cotonou","Kpassè, Ouidah",40.6,5000
"Zongo, Cotonou","Zoungbodji, Ouidah",41.6,5500
"Zongo, Cotonou","Savi, Ouidah",39.8,5000
"Zongo, Cotonou","Gakpè, Ouidah",36.0,5000
"Zongo, Cotonou","Djègbadji, Ouidah",42.8,5500
"Zongo, Cotonou","Houakpè-Daho, Ouidah",49.2,6000
"Gbégamey, Cotonou","Avlékété, Ouidah",28.2,4000
"Gbégamey, Cotonou","Tovè, Ouidah",40.2,5000
"Gbégamey, Cotonou","Centre-ville (Place Chacha), Ouidah",42.0,5500
"Gbégamey, Cotonou","Kpassè, Ouidah",41.1,5500
"Gbégamey, Cotonou","Zoungbodji, Ouidah",42.1,5500
"Gbégamey, Cotonou","Savi, Ouidah",40.2,5000
"Gbégamey, Cotonou","Gakpè, Ouidah",36.4,5000
"Gbégamey, Cotonou","Djègbadji, Ouidah",43.3,5500
"Gbégamey, Cotonou","Houakpè-Daho, Ouidah",49.7,6000
"Étoile Rouge, Cotonou","Avlékété, Ouidah",27.8,4000
"Étoile Rouge, Cotonou","Tovè, Ouidah",39.8,5000
"Étoile Rouge, Cotonou","Centre-ville (Place Chacha), Ouidah",41.5,5500
"Étoile Rouge, Cotonou","Kpassè, Ouidah",40.6,5000
"Étoile Rouge, Cotonou","Zoungbodji, Ouidah",41.6,5500
"Étoile Rouge, Cotonou","Savi, Ouidah",39.8,5000
"Étoile Rouge, Cotonou","Gakpè, Ouidah",36.0,5000
"Étoile Rouge, Cotonou","Djègbadji, Ouidah",42.8,5500
"Étoile Rouge, Cotonou","Houakpè-Daho, Ouidah",49.2,6000
"Jéricho / Marocana, Cotonou","Avlékété, Ouidah",29.9,4500
"Jéricho / Marocana, Cotonou","Tovè, Ouidah",41.8,5500
"Jéricho / Marocana, Cotonou","Centre-ville (Place Chacha), Ouidah",43.6,5500
"Jéricho / Marocana, Cotonou","Kpassè, Ouidah",42.7,5500
"Jéricho / Marocana, Cotonou","Zoungbodji, Ouidah",43.7,5500
"Jéricho / Marocana, Cotonou","Savi, Ouidah",41.8,5500
"Jéricho / Marocana, Cotonou","Gakpè, Ouidah",38.1,5000
"Jéricho / Marocana, Cotonou","Djègbadji, Ouidah",44.9,5500
"Jéricho / Marocana, Cotonou","Houakpè-Daho, Ouidah",51.3,6000
"Dantokpa, Cotonou","Avlékété, Ouidah",30.9,4500
"Dantokpa, Cotonou","Tovè, Ouidah",42.9,5500
"Dantokpa, Cotonou","Centre-ville (Place Chacha), Ouidah",44.7,5500
"Dantokpa, Cotonou","Kpassè, Ouidah",43.8,5500
"Dantokpa, Cotonou","Zoungbodji, Ouidah",44.8,5500
"Dantokpa, Cotonou","Savi, Ouidah",42.9,5500
"Dantokpa, Cotonou","Gakpè, Ouidah",39.1,5000
"Dantokpa, Cotonou","Djègbadji, Ouidah",46.0,5500
"Dantokpa, Cotonou","Houakpè-Daho, Ouidah",52.4,6000
"Ganhi, Cotonou","Avlékété, Ouidah",31.5,4500
"Ganhi, Cotonou","Tovè, Ouidah",43.5,5500
"Ganhi, Cotonou","Centre-ville (Place Chacha), Ouidah",45.3,5500
"Ganhi, Cotonou","Kpassè, Ouidah",44.4,5500
"Ganhi, Cotonou","Zoungbodji, Ouidah",45.4,5500
"Ganhi, Cotonou","Savi, Ouidah",43.5,5500
"Ganhi, Cotonou","Gakpè, Ouidah",39.7,5000
"Ganhi, Cotonou","Djègbadji, Ouidah",46.6,5500
"Ganhi, Cotonou","Houakpè-Daho, Ouidah",53.0,6000
"Akpakpa Centre, Cotonou","Avlékété, Ouidah",34.0,4500
"Akpakpa Centre, Cotonou","Tovè, Ouidah",46.0,5500
"Akpakpa Centre, Cotonou","Centre-ville (Place Chacha), Ouidah",47.7,6000
"Akpakpa Centre, Cotonou","Kpassè, Ouidah",46.8,5500
"Akpakpa Centre, Cotonou","Zoungbodji, Ouidah",47.8,6000
"Akpakpa Centre, Cotonou","Savi, Ouidah",46.0,5500
"Akpakpa Centre, Cotonou","Gakpè, Ouidah",42.2,5500
"Akpakpa Centre, Cotonou","Djègbadji, Ouidah",49.0,6000
"Akpakpa Centre, Cotonou","Houakpè-Daho, Ouidah",55.4,6500
"Akpakpa Dodomè, Cotonou","Avlékété, Ouidah",34.6,4500
"Akpakpa Dodomè, Cotonou","Tovè, Ouidah",46.6,5500
"Akpakpa Dodomè, Cotonou","Centre-ville (Place Chacha), Ouidah",48.4,6000
"Akpakpa Dodomè, Cotonou","Kpassè, Ouidah",47.4,6000
"Akpakpa Dodomè, Cotonou","Zoungbodji, Ouidah",48.4,6000
"Akpakpa Dodomè, Cotonou","Savi, Ouidah",46.6,5500
"Akpakpa Dodomè, Cotonou","Gakpè, Ouidah",42.8,5500
"Akpakpa Dodomè, Cotonou","Djègbadji, Ouidah",49.7,6000
"Akpakpa Dodomè, Cotonou","Houakpè-Daho, Ouidah",56.0,6500
"Akpakpa PK3, Cotonou","Avlékété, Ouidah",35.9,5000
"Akpakpa PK3, Cotonou","Tovè, Ouidah",47.8,6000
"Akpakpa PK3, Cotonou","Centre-ville (Place Chacha), Ouidah",49.6,6000
"Akpakpa PK3, Cotonou","Kpassè, Ouidah",48.7,6000
"Akpakpa PK3, Cotonou","Zoungbodji, Ouidah",49.7,6000
"Akpakpa PK3, Cotonou","Savi, Ouidah",47.8,6000
"Akpakpa PK3, Cotonou","Gakpè, Ouidah",44.1,5500
"Akpakpa PK3, Cotonou","Djègbadji, Ouidah",50.9,6000
"Akpakpa PK3, Cotonou","Houakpè-Daho, Ouidah",57.3,6500
"Fidjrossè, Cotonou",Pahou,20.3,2500
"Agla, Cotonou",Pahou,18.8,2500
"Menontin, Cotonou",Pahou,19.0,2500
"Kouhounou, Cotonou",Pahou,20.7,2500
"Vèdoko, Cotonou",Pahou,21.9,2500
"Haie Vive, Cotonou",Pahou,23.8,2500
"Patte d'Oie, Cotonou",Pahou,23.9,2500
"Cadjehoun, Cotonou",Pahou,24.8,2500
"Sainte Rita, Cotonou",Pahou,23.2,2500
"Zongo, Cotonou",Pahou,24.7,2500
"Gbégamey, Cotonou",Pahou,25.2,2500
"Étoile Rouge, Cotonou",Pahou,24.7,2500
"Jéricho / Marocana, Cotonou",Pahou,26.8,2500
"Dantokpa, Cotonou",Pahou,27.9,3000
"Ganhi, Cotonou",Pahou,28.5,3000
"Akpakpa Centre, Cotonou",Pahou,30.9,3000
"Akpakpa Dodomè, Cotonou",Pahou,31.5,3000
"Akpakpa PK3, Cotonou",Pahou,32.8,3000`;

function parseLine(line) {
  const parts = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      parts.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  parts.push(cur.trim());
  return parts;
}

const lines = rawCsv.split('\n').filter(l => l.trim() && !l.startsWith('Départ'));

const routes = [];
const places = new Map(); // key -> { name, commune, raw }

function extractPlace(str) {
  str = str.replace(/^"|"$/g, '').trim();
  // e.g. "Fidjrossè, Cotonou" or "Pahou" or "Jéricho / Marocana, Cotonou"
  if (str === 'Pahou') {
    return { name: 'Pahou', commune: 'Ouidah', communeKey: 'ouidah', raw: 'Pahou' };
  }
  if (str.includes(',')) {
    const idx = str.lastIndexOf(',');
    const name = str.slice(0, idx).trim();
    const comm = str.slice(idx + 1).trim();
    let cKey = 'cotonou';
    if (comm.toLowerCase().includes('calavi')) cKey = 'calavi';
    else if (comm.toLowerCase().includes('porto')) cKey = 'portonovo';
    else if (comm.toLowerCase().includes('ouidah')) cKey = 'ouidah';
    else if (comm.toLowerCase().includes('seme')) cKey = 'seme';
    return { name, commune: comm, communeKey: cKey, raw: str };
  }
  return { name: str, commune: str, communeKey: str.toLowerCase(), raw: str };
}

lines.forEach(line => {
  const parts = parseLine(line);
  if (parts.length >= 4) {
    const pDep = extractPlace(parts[0]);
    const pDst = extractPlace(parts[1]);
    const dist = parseFloat(parts[2]);
    const tarif = parseInt(parts[3], 10);
    routes.push({
      dep: pDep,
      dst: pDst,
      dist,
      tarif
    });
    places.set(pDep.raw, pDep);
    places.set(pDst.raw, pDst);
  }
});

console.log('Total routes parsed:', routes.length);
console.log('Total distinct places:', places.size);

const byCommune = {};
for (const p of places.values()) {
  if (!byCommune[p.communeKey]) byCommune[p.communeKey] = new Set();
  byCommune[p.communeKey].add(p.name);
}

for (const [k, v] of Object.entries(byCommune)) {
  console.log(`Commune [${k}]: ${Array.from(v).join(', ')}`);
}

fs.writeFileSync('scripts/parsed-routes.json', JSON.stringify({ routes, places: Array.from(places.values()) }, null, 2));
