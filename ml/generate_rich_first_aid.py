#!/usr/bin/env python3
import csv
import json
import os

# Define detailed emergency first aid guidelines for Ugandan health context
DISEASES_DATA = [
    {
        "id": 1,
        "title": "Malaria",
        "title_lg": "Malaria",
        "icon": "bug",
        "color": "#E53E3E",
        "steps": [
            "Monitor body temperature using a clean thermometer. A high fever (above 37.5°C) is a critical warning sign that requires urgent diagnostic testing.",
            "Keep the patient hydrated by offering clean water, clear broths, or Oral Rehydration Salts (ORS) to prevent dehydration caused by sweating and high fever.",
            "Seek medical assessment at the nearest health center within 24 hours. Early diagnosis via RDT (Rapid Diagnostic Test) or microscopy is vital for saving lives.",
            "Administer the full course of prescribed ACTs (Artemisinin-based Combination Therapy) exactly as directed by a healthcare professional. Avoid sharing or self-medicating."
        ],
        "steps_lg": [
            "Kebera ebbugumu ly'omubiri nga okozesa ekyuma ekipima ebbugumu (thermometer). Ebbugumu erisukka 37.5°C kabonero kakabi akeetaaga okukeberebwa amangu.",
            "Nywesa omulwadde amazzi amayonjo agawera, ORS oba supu omulungi okuziyiza omubiri okuggwamu amazzi olw'omusujja n'okutuuyana.",
            "Genda mu ddwaliro oba mu kifo eky'obulamu ekiri okumpi mu ssaawa 24. Okukeberebwa amangu kusaabaawo obulamu buli lunaku.",
            "Mina eddagala lya ACT lyonna nga bwe lyalagiddwa omusawo. Wewale okugabana ddagala oba okweyagala ddagala ku bubwo."
        ]
    },
    {
        "id": 2,
        "title": "Diarrhea",
        "title_lg": "Okuddukana",
        "icon": "water",
        "color": "#3182CE",
        "steps": [
            "Immediately begin administering Oral Rehydration Salts (ORS) solution (1 sachet dissolved in 1 liter of clean water) after every loose stool to replace lost water and essential salts.",
            "For infants under 6 months, continue exclusive and frequent breastfeeding. Do not withhold food or fluids from children.",
            "For children under 5 years, initiate a daily Zinc supplement (20mg, or 10mg if under 6 months) for 10-14 days to reduce duration and severity.",
            "Promptly seek medical help if the patient exhibits signs of severe dehydration (lethargy, sunken eyes, skin pinch returns slowly) or if there is blood in the stool."
        ],
        "steps_lg": [
            "Tandika amangu okuwa eddagala lya ORS (sake emu mu yita y'amazzi amayonjo) buli lwe ddukana okuddiza omubiri amazzi n'omunnyu oguguddemu.",
            "Ku baana abali wansi w'emyezi 6, weyongere okunyisa amabeere buli kaseera. Weewale okumamma omwana emmere oba amazzi.",
            "Ku baana abali wansi w'emyaka 5, tandika okubaweereza ebirungo bya Zinc (20mg buli lunaku, oba 10mg singa ali wansi w'emyezi 6) okumala ennaku 10-14 okukendeeza okuddukana.",
            "Genda mangu eri abasawo singa omulwadde alaga obubonero obw'okuggwamu amazzi (okuzirika, amaaso agagudde munda) oba nga mulimu omusaayi mu caafu."
        ]
    },
    {
        "id": 3,
        "title": "Snake Bite",
        "title_lg": "Okulumwa Omusota",
        "icon": "snake",
        "color": "#DD6B20",
        "steps": [
            "Keep the victim calm, reassured, and completely still. Immobilize the bitten limb at or below heart level to slow the spread of venom.",
            "Remove all tight clothing, jewelry, rings, or shoes near the bite area immediately, as significant swelling will occur.",
            "Do NOT attempt to cut the wound, suck out the venom, apply ice, or use a tight tourniquet, as these actions worsen tissue damage.",
            "Transport the patient immediately and safely to the nearest hospital that stocks anti-venom. If possible, note the snake's appearance without putting yourself at risk."
        ],
        "steps_lg": [
            "Mukuume nga ateekedde era awummudde. Lemesa okutambula kw'ekitundu ekilumiddwa (omukono oba okugulu) okuzeeyiza okusaasaana kw'obusagwa.",
            "Ggyayo engoye ezikwata, eby'obulungi, empeta oba engatto okumpi n'ekifo ekilumiddwa, kubanga kizimba mangu.",
            "TOGEZAAKO kusala woga, kunywa busagwa, kuteekako buperebwa oba okusiba ekisiba omusaayi eky'amaanyi, kyonoonoza ebinywa.",
            "Mutwale mangu mu ddwaliro eriri okumpi eririna eddagala ly'emisota. Singa kisoboka, egera engeri omusota gwe gufaananamu naye wewale obubenje."
        ]
    },
    {
        "id": 4,
        "title": "Burns",
        "title_lg": "Okwokya",
        "icon": "fire",
        "color": "#E53E3E",
        "steps": [
            "Immediately place the burned area under cool, gently running clean water for at least 20 minutes to stop the burning process and soothe the pain.",
            "Gently cover the burn with a clean, dry, non-stick sterile dressing or plastic food wrap. Do NOT apply home remedies like butter, oil, grease, or toothpaste, as they trap heat and invite infection.",
            "Manage moderate pain by administering appropriate age-based doses of paracetamol or ibuprofen.",
            "Seek immediate medical attention for burns that are large (larger than the patient's palm), blistered, charred, or located on the face, hands, feet, or groin."
        ],
        "steps_lg": [
            "Teeka amangwago ekifo ekyokesezza wansi w'amazzi amayonjo agannyogoga agatambula okumala eddakiika 20 okuziyiza okwokya okugenda mu maaso.",
            "Bikka mpolampola ekifo ekyokesezza n'olugoye olulongoofu olw'omulembe oba akapiira k'emmere. TOGEZAAKO kuteekako bizigo, muzigo, zzaabu, oba ddagala lya mannyo, bino bikuumira ebbugumu ate biviirako obulwadde.",
            "Wa omulwadde eddagala ly'obulumi erya Paracetamol oba Ibuprofen okusinziira ku myaka gye.",
            "Noonya obuyambi bw'abasawo mangu singa okwokya kunene (okusukka ku kibatu ky'omulwadde), kuliko ebikulukuta oba kuli ku maaso, ngalo, bigere oba mu bisambi."
        ]
    },
    {
        "id": 5,
        "title": "COVID-19",
        "title_lg": "COVID-19",
        "icon": "virus",
        "color": "#319795",
        "steps": [
            "Isolate the patient in a single, well-ventilated room. Open windows to maximize outdoor airflow and minimize sharing communal spaces.",
            "Monitor body temperature and blood oxygen levels regularly using a pulse oximeter. Watch for signs of worsening fever or oxygen desaturation.",
            "Ensure all caregivers and the patient wear high-quality medical/respiratory masks, and maintain frequent hand hygiene using soap and clean water.",
            "Rush to the nearest health facility immediately if the patient develops difficulty breathing, persistent chest pain, confusion, or bluish lips."
        ],
        "steps_lg": [
            "Mukuume nga ali yekka mu kasenge akalimu ompewo ennungi. Ggulawo amadirisa okutuusa empewo ennyingi era wewale okukozesa ebisenge eby'awamu.",
            "Kebera ebbugumu ly'omubiri n'amazzi agali mu musaayi (oxygen) bulijjo nga okozesa pulse oximeter okuzuula embeera.",
            "Kakasa nti abalabirira n'omulwadde bambala masiki (masks) bulijjo ate baanaaba mu ngalo n'esabuni n'amazzi amayonjo.",
            "Yanguwa okutwala omulwadde mu ddwaliro singa afuna obuzibu mu kufulumya empewo, obulumi mu kifuba obutakoma oba okuzirika."
        ]
    },
    {
        "id": 6,
        "title": "Tuberculosis",
        "title_lg": "Kafuba",
        "icon": "lungs",
        "color": "#805AD5",
        "steps": [
            "Ensure strict adherence to the complete, uninterrupted 6-month regimen of anti-TB drugs. Incomplete treatment leads to dangerous drug-resistant TB.",
            "Screen all household members and close contacts, especially children and immunocompromised individuals, for chronic cough and fever.",
            "Maintain open ventilation in the living space by keeping windows and doors open to allow sunlight and fresh air to clear airborne TB bacteria.",
            "Encourage a balanced, nutrient-dense diet to assist weight recovery, and monitor the patient for side effects like yellow eyes, joint pain, or numbness."
        ],
        "steps_lg": [
            "Kakasa nti omulwadde amina eddagala lya kafuba lyonna okumala emyezi 6 awatali kusubwa lunaku na lumu, okuziyiza kafuba akatayise ddagala (drug-resistant TB).",
            "Kebere abantu bonna abali ewaka n'abalala abamulinako obukwata, naddala abaana, ku kifuba eky'olubeerera n'omusujja.",
            "Kuuma ennyumba nga nnyangu okuyingiramu empewo n'omusana nga oggulawo amadirisa n'enzigi bulijjo okuggyako obucaafu.",
            "Mugabirire emmere ey'ebirungo ebiwera okunyweza obuzito era mukebera ku bubonero obw'obuzibu bw'eddagala nga amaaso agakyuka kyenvu oba okusanyalala."
        ]
    },
    {
        "id": 7,
        "title": "HIV/AIDS",
        "title_lg": "Mukenenya",
        "icon": "ribbon",
        "color": "#E53E3E",
        "steps": [
            "Initiate Antiretroviral Therapy (ART) immediately upon diagnosis. ART is life-saving, restores health, and suppresses the viral load.",
            "Maintain 100% adherence to ART medications by taking them at the exact same time every day. Use alarms, pillboxes, or treatment buddies to avoid missed doses.",
            "Support the immune system by consuming a balanced, protein-rich diet and drinking safe, boiled water to prevent opportunistic food and waterborne infections.",
            "Consistently practice safe sex using male or female condoms to prevent transmitting the virus or contracting drug-resistant strains."
        ],
        "steps_lg": [
            "Tandika eddagala lya ART amangwago nga bamaze okukukakasa. Eddagala lino likuuma obulamu, likendeeza akawuka.",
            "Kakasa nti omira eddagala buli lunaku mu ssaawa eyo yennyini. Kozesa kukebera kw'esimu oba omuntu akujjukiza okuziyiza okusubwa.",
            "Nyweza obusobozi bw'omubiri nga olya emmere erimu protein n'okunywa amazzi amafumbwe bulungi okuziyiza endwadde ezikutaba.",
            "Kozesa obupiira (condoms) buli lwe weegatta okuziyiza okusaasaanya akawuka oba okufuna akawuka akatayise ddagala lya ART."
        ]
    },
    {
        "id": 8,
        "title": "Cholera",
        "title_lg": "Kolerera",
        "icon": "biohazard",
        "color": "#38A169",
        "steps": [
            "Give large quantities of Oral Rehydration Salts (ORS) solution continuously. For every watery stool, administer at least 1-2 cups of ORS to match fluid loss.",
            "Isolate the patient and assign dedicated utensils, a bed, and toilet/latrine access to block the transmission of highly contagious cholera bacteria.",
            "Decontaminate hands with chlorinated water or soap immediately after contact, and sanitize patient bedding and environment using a dilute bleach solution.",
            "Seek emergency medical treatment immediately for intravenous (IV) fluid therapy if the patient cannot swallow, is vomiting persistently, or is in shock."
        ],
        "steps_lg": [
            "Wa omulwadde ORS amangwago era buli kaseera. Buli lwe ddukana, muwemu ebekere 1-2 ebya ORS okusaanya amazzi agafukuse.",
            "Wawula omulwadde era omuwe ebikozesebwa eby'enjawulo, ekitanda, n'ebinaabiro okuziyiza okusiiga abalala kolerera.",
            "Naaba mu ngalo n'amazzi agalimu chlorine oba sabuni mangu ddala nga ozzeeko okumukwatako, era teeka eddagala ku linaabiro.",
            "Genda mu ddwaliro mangu ddala ofune eddagala lya IV fluids singa omulwadde alemwa okunywa, usesema nnyo, oba azirise."
        ]
    },
    {
        "id": 9,
        "title": "Measles",
        "title_lg": "Mumpumpu",
        "icon": "dots-vertical",
        "color": "#D69E2E",
        "steps": [
            "Strictly isolate the infected child from other children for at least 5 days starting from the day the rash first appeared to prevent community outbreaks.",
            "Administer Vitamin A supplements immediately (two doses on consecutive days) to protect the child's eyesight and reduce the risk of severe complications.",
            "Control high fever using Paracetamol. Clean crusty eyes gently with clean cotton wool dipped in cooled, boiled water (use a separate piece for each eye).",
            "Ensure continuous hydration and nutrition. Monitor closely for danger signs such as rapid breathing, severe earache, or neck stiffness."
        ],
        "steps_lg": [
            "Kuuma omwana omulwadde wekka okumala ennaku 5 okuva olugoye lwe lwatandika okulabika okuziyiza okusaasaanya mumpumpu mu baana abalala.",
            "Wa omwana eddagala lya Vitamin A amangwago (emirundi ebiri mu nnaku z'omuddiringanwa) okukuuma amaaso ge n'okuziyiza obuzibu obw'obusagwa.",
            "Kozesa Paracetamol ku musujja omungi. Longoosa amaaso n'amapampa nga okozesa pamba n'amazzi amafumbwe (kozesa pamba ow'enjawulo ku buli liiso).",
            "Kakasa nti omwana anywa amazzi bulungi era alya. Kebera bulijjo obubonero bw'akabenje nga okufuwa mangu oba okukogga kw'osingo."
        ]
    },
    {
        "id": 10,
        "title": "Polio",
        "title_lg": "Polio",
        "icon": "walk",
        "color": "#4A5568",
        "steps": [
            "Polio has no cure. Support children experiencing sudden weakness with absolute rest, warm compresses on limbs, and physical therapy rehabilitation.",
            "Ensure all infants and children under 5 receive their complete routine oral polio vaccine (OPV) and inactivated polio vaccine (IPV) doses.",
            "Report any case of acute flaccid paralysis (sudden floppy weakness in limbs) in children under 15 to the district health team within 24 hours.",
            "Practice strict sanitation: wash hands with soap before food prep, treat water, and dispose of baby diapers/feces safely in a pit latrine."
        ],
        "steps_lg": [
            "Polio talina ddagala limuwonya. Yamba omwana afunye obunafu obw'amangwago nga omubugumya, n'okutendeka ebinywa mpolampola.",
            "Kakasa nti abaana bonna abali wansi w'emyaka 5 bafuna eddagala lya polio drops ery'olubeerera n'ery'okugema (OPV/IPV).",
            "Tegeeza abakulira ebyobulamu mu disitulikiti mu ssaawa 24 singa wabaawo omwana wansi w'emyaka 15 afuna obunafu obw'amangwago mu mikono oba emagulu.",
            "Kuuma obuyonjo: naaba mu ngalo n'esabuni, teesa amazzi g'okunywa, era ggyako obucaafu bw'abaana mangu mu kinnya ky'obuyonjo."
        ]
    },
    {
        "id": 11,
        "title": "Syphilis",
        "title_lg": "Kabotongo",
        "icon": "alert-decagram",
        "color": "#9B2C2C",
        "steps": [
            "Perform rapid laboratory serological screening to confirm infection. Syphilis is highly curable but dangerous if left untreated.",
            "Ensure both the patient and all sexual partners are treated simultaneously with intramuscular Benzathine Penicillin G to prevent re-infection.",
            "Strictly abstain from any sexual contact until both partners have fully completed the prescribed antibiotic therapy and sores have healed.",
            "Screen all pregnant women at their first ANC visit; treating maternal syphilis prevents miscarriage, stillbirth, or severe congenital defects."
        ],
        "steps_lg": [
            "Kola okukeberebwa kw'omusaayi mu laboratory okukakasa. Kabotongo awonnyebwa mangu naye wa kabi nnyo singa talongoosebwa.",
            "Kakasa nti bombi n'abo be weegatta nabo bajjanjabirwa wamu n'eddagala lya Benzathine Penicillin G okuziyiza okusiigagana emirundi emirala.",
            "Wewale ddala okwegatta okutuusa nga okujjanjaba kwonna kuwedde era nga ebiwundu byonna biwonye ddala.",
            "Kebera abakazi ab'olubuto bonna ku lwebanda olusooka; okujjanjaba kabotongo mu bakazi kukuuma olubuto n'omwana ali munda."
        ]
    },
    {
        "id": 12,
        "title": "Typhoid",
        "title_lg": "Musujja gw'omubyenda",
        "icon": "thermometer",
        "color": "#D69E2E",
        "steps": [
            "Consume only water that has been boiled vigorously for at least 1 minute or treated with chlorine, and store it in clean, covered containers.",
            "Wash hands thoroughly with soap and running water before preparing food, eating, and immediately after using the toilet/latrine.",
            "Ensure all food is thoroughly cooked to high temperatures and served hot. Avoid raw vegetables, unpeeled fruits, and street food.",
            "Administer the full course of prescribed oral antibiotics (such as Ciprofloxacin or Azithromycin). Do not stop when symptoms improve."
        ],
        "steps_lg": [
            "Nywa amazzi amafumbwe bulungi (ageesera okumala eddakiika 1) oba agaddwamu eddagala lya chlorine, era gaseke mu bibya ebisibye bulungi.",
            "Naaba mu ngalo n'esabuni n'amazzi agatambula nga tonnategeka mmere, nga tonnalya, n'okuva mu kabuyonjo.",
            "Kakasa nti emmere eyidde bulungi nnyo era ewebwa ekyokya. Wewale emmere ey'obucaafu n'ebibala ebitolebwa ebitaaye.",
            "Mina eddagala lya antibiotics eryakuweebwa (nga Ciprofloxacin oba Azithromycin) lyonna awatali kukomako nga embeera ekyukase."
        ]
    },
    {
        "id": 13,
        "title": "Pneumonia",
        "title_lg": "Kifuba ky'omu mawuggwe",
        "icon": "lungs",
        "color": "#3182CE",
        "steps": [
            "Check for danger signs in children: rapid breathing (more than 50 breaths/min for infants), chest in-drawing, or grunting sounds.",
            "Give dispersible Amoxicillin tablets or syrup exactly as prescribed by the health worker to combat the bacterial lung infection.",
            "Keep the patient warm and dry in a comfortable room. Ensure they continue feeding and drinking small, frequent sips of warm fluids.",
            "Rush to the hospital immediately if the child becomes unusually sleepy, difficult to wake, vomits everything, or is unable to drink."
        ],
        "steps_lg": [
            "Kebera obubonero bw'akabenje mu baana: okufuwa mangu (okusukka emirundi 50 buli ddakiika), ekifuba okugenda munda, oba okuwulira eddoboozi.",
            "Wa omwana eddagala lya Amoxicillin (dispersible tablets) oba ebisasiro nga bwe kyalagiddwa omusawo okujjanja obulwadde bw'omu mawuggwe.",
            "Kuuma omulwadde nga abugumye era nga omubiri mukalu. Kakasa nti alya era anywa mpolampola naye buli kaseera amazzi amabugumu.",
            "Yanguwa okutwala omwana mu ddwaliro singa weyongera okuzirika, alemwa okunywa oba asesema emmere yonna."
        ]
    },
    {
        "id": 14,
        "title": "Diabetes",
        "title_lg": "Sukali",
        "icon": "water-percent",
        "color": "#319795",
        "steps": [
            "Perform regular blood glucose testing using a personal glucometer. Keep a daily log of readings before and after meals.",
            "Strictly adhere to daily prescribed oral diabetic medications or insulin injections at correct dosages. Never adjust doses without consulting a doctor.",
            "Adopt a healthy diet high in fiber, whole grains, and fresh vegetables while minimizing refined sugars. Engage in 30 minutes of moderate exercise daily.",
            "Learn to recognize and treat hypoglycemia (sweating, shaking, confusion - give sugar/juice) and hyperglycemia (extreme thirst, sweet-smelling breath)."
        ],
        "steps_lg": [
            "Kebera omusaayi ku sukaali buli kaseera nga okozesa ekyuma ekipima sukaali (glucometer) era wandiika buli kye weese.",
            "Mina eddagala lya sukaali eryalagiddwa oba insulin buli lunaku bulungi. Togezako kukyusa ku ddagala lyo nga tonnabuuza musawo.",
            "Kozesa emmere erimu ebinuzi bingi nga ebisagazi, emmere ey'ebikoola ate okendeeze sukaali. Kola dduyiro ddakiika 30 buli lunaku.",
            "Manya engeri y'okujjanjaba sukaali okukka ennyo (okutuuyana, okutuguta - muwe sukaali/cucu) oba okulinnya (okuyaayaanira amazzi)."
        ]
    },
    {
        "id": 15,
        "title": "Hypertension",
        "title_lg": "Puleesa",
        "icon": "heart-pulse",
        "color": "#805AD5",
        "steps": [
            "Regularly check and record blood pressure levels. Normal resting blood pressure should ideally be below 120/80 mmHg.",
            "Reduce daily salt intake to less than 5 grams (about 1 teaspoon) and avoid processed foods, carbonated drinks, and excessive fats.",
            "Take antihypertensive drugs daily without skipping a dose, even when you feel perfectly healthy. Hypertension is a silent killer.",
            "Seek emergency care immediately for severe symptoms: sudden numbness, difficulty speaking, crushing chest pain, or a splitting headache."
        ],
        "steps_lg": [
            "Kebera puleesa yo bulijjo era ogiwandiike. Puleesa ennungi ey'omuntu awummudde esaanidde okuba wansi wa 120/80 mmHg.",
            "Kendeeza omunnyu gw'olya ku lunaku (wansi w'akasiiko kamu aka tii) era weewale emmere eyo mu mikebe n'amasavu amangi.",
            "Mina eddagala lya puleesa buli lunaku awatali kusubwa, n'olunaku lwe owulira nga oli mulamu ddala. Puleesa etta kasirise.",
            "Genda mu ddwaliro mangu ddala singa ofuna: okusanyalala kw'omubiri obw'amangwago, okulemererwa kw'okwogera, oba obulumi mu kifuba."
        ]
    },
    {
        "id": 16,
        "title": "Malnutrition",
        "title_lg": "Okugotta / Endya Embi",
        "icon": "food-apple",
        "color": "#DD6B20",
        "steps": [
            "Screen infants and young children regularly using a MUAC (Mid-Upper Arm Circumference) tape. A measurement in the red zone (<11.5cm) indicates severe malnutrition.",
            "Administer Ready-to-Use Therapeutic Food (RUTF) like Plumpy'Nut exactly as prescribed. Do not dilute RUTF or share it with other family members.",
            "Provide prescribed medical treatments including Vitamin A, deworming tablets (Mebendazole/Albendazole), and antibiotics to treat underlying infections.",
            "Gradually introduce a nutritious, energy-dense balanced diet (enriched porridge with groundnuts, eggs, milk, and mashed fruits) to prevent relapse."
        ],
        "steps_lg": [
            "Kebera abaana mpolampola nga okozesa omugwa gwa MUAC. Kipimo ekiri mu kitundu ekimyufu (<11.5cm) kiraga obugotta obw'amaanyi.",
            "Wa omwana emmere eya RUTF nga Plumpy'Nut nga bwe kyalagiddwa omusawo. Togezako okugitabulamu mazzi oba okugigabana n'abalala ewaka.",
            "Mugabirire eddagala ly'obulamu eryalagiddwa nga Vitamin A, eddagala ly'ebiwuka (Mebendazole), n'antibiotics okutta obulwadde obuli munda.",
            "Tandika mpolampola okumuwa emmere ey'ebirungo ebisookerwako (uji ogulimu ebinywebwa, amagi, amata, n'ebibala ebisirikiddwa)."
        ]
    },
    {
        "id": 17,
        "title": "Obstetric Emergencies",
        "title_lg": "Ebizibu by'okuzaala",
        "icon": "baby-carriage",
        "color": "#E53E3E",
        "steps": [
            "Recognize maternal danger signs immediately: heavy vaginal bleeding, convulsions/fits, severe headache, blurred vision, or high fever during pregnancy or labor.",
            "Do NOT wait. Arrange immediate emergency transport to a hospital providing Comprehensive Emergency Obstetric and Newborn Care (CEmONC) services.",
            "Keep the pregnant woman lying on her left side, keep her warm with blankets, and ensure her airway is clear and unrestricted during transit.",
            "Ensure all deliveries are managed by a skilled, qualified birth attendant or midwife at a health facility to prevent postpartum hemorrhage and neonatal infections."
        ],
        "steps_lg": [
            "Manya amangu obubonero bw'akabenje mu bakazi: okufukumuka omusaayi omungi, okugwa kigwo, omutwe omubi ennyo, okulemererwa okulaba, oba omusujja omungi mu lubuto.",
            "TOGEZAAKO kulwisawo. Kola entegeka y'amangwago emutwala mu ddwaliro erina obuyambi bwa CEmONC obw'embaga.",
            "Mugalamize ku luuyi lwe olw'okkono, omubugumye bulungi n'ebikuta, era kakasa nti afluwumya empewo bulungi nga mumutwala.",
            "Kakasa nti okuluzaala kwonna kukolebwa omuzalisa omutendeke mu ddwaliro okuziyiza omusaayi okufukumuka n'endwadde mu baana."
        ]
    }
]

def generate_csv():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    target_path = os.path.join(script_dir, "../src/db/uganda_diseases.csv")
    
    print(f"Writing rich dataset to: {target_path}")
    
    headers = ["id", "title", "title_lg", "icon", "color", "steps_json", "steps_lg_json"]
    
    with open(target_path, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        
        for item in DISEASES_DATA:
            writer.writerow({
                "id": item["id"],
                "title": item["title"],
                "title_lg": item["title_lg"],
                "icon": item["icon"],
                "color": item["color"],
                "steps_json": json.dumps(item["steps"]),
                "steps_lg_json": json.dumps(item["steps_lg"])
            })
            
    print("CSV generated successfully!")

if __name__ == "__main__":
    generate_csv()
