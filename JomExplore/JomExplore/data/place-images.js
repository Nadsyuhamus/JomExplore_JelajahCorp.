// Locally stored Wikimedia Commons photos with the attribution required by each licence.
const placeImages = {
    KL001: { src: "images/places/KL001.jpg", alt: "Jalan Alor Food Street", creator: "Raki_Man", license: "CC BY 3.0", source: "https://commons.wikimedia.org/wiki/File:Jalan_Alor_Food_Street,_KL_-_panoramio.jpg" },
    KL015: { src: "images/places/KL015.jpg", alt: "Saloma Bistro", creator: "Farhan", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Saloma_Bistro.jpg" },
    KL017: { src: "images/places/KL017.jpg", alt: "Islamic Arts Museum Malaysia", creator: "CEphoto, Uwe Aranas", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Kuala_Lumpur_Malaysia_Islamic-Arts-Museum-01.jpg" },
    KL018: { src: "images/places/KL018.jpg", alt: "Bank Negara Malaysia Museum and Art Gallery", creator: "Vano111ru", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Bank_Negara_Malaysia_Museum_and_Art_Gallery.jpg" },
    KL020: { src: "images/places/KL020.jpg", alt: "National Textile Museum", creator: "Radosław Botev", license: "CC BY 3.0 pl", source: "https://commons.wikimedia.org/wiki/File:National_Textile_Museum_building,_Kuala_Lumpur.jpg" },
    KL021: { src: "images/places/KL021.jpg", alt: "Royal Selangor Visitor Centre", creator: "Frostpolar", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Royal_Selangor_Visitor_Center_-_Pewter_Factory_in_Kuala_Lumpur,_Malaysia_(3).jpg" },
    KL023: { src: "images/places/KL023.jpg", alt: "Dataran Merdeka", creator: "CEphoto, Uwe Aranas", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Kuala_Lumpur_Malaysia_Dataran-Merdeka-Fountain-01.jpg" },
    KL024: { src: "images/places/KL024.jpg", alt: "Sultan Abdul Samad Building", creator: "CEphoto, Uwe Aranas", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Kuala_Lumpur_Malaysia_Sultan-Abdul-Samad-Building-02.jpg" },
    KL025: { src: "images/places/KL025.jpg", alt: "Masjid Negara", creator: "Vyacheslav Argenberg", license: "CC BY 4.0", source: "https://commons.wikimedia.org/wiki/File:Kuala_Lumpur,_Malaysia,_Masjid_Negara.jpg" },
    KL026: { src: "images/places/KL026.jpg", alt: "Federal Territory Mosque", creator: "CEphoto, Uwe Aranas", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Kuala_Lumpur_Malaysia_Federal-Territory-Mosque-03.jpg" },
    KL028: { src: "images/places/KL028.jpg", alt: "Sin Sze Si Ya Temple", creator: "Alexey Komarov", license: "CC BY 3.0", source: "https://commons.wikimedia.org/wiki/File:Sin_Sze_Si_Ya_Temple_-_panoramio.jpg" },
    KL029: { src: "images/places/KL029.jpg", alt: "Thean Hou Temple", creator: "Alexey Komarov", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Thean_Hou_Temple,_Kuala_Lumpur-1.jpg" },
    KL031: { src: "images/places/KL031.jpg", alt: "KLCC Park", creator: "Marcin Konsek", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:2016_Kuala_Lumpur,_Park_KLCC_i_Suria_KLCC.jpg" },
    KL032: { src: "images/places/KL032.jpg", alt: "Perdana Botanical Garden", creator: "RivieraBarnes", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:KL_Perdana_Botanical_Garden_5.jpg" },
    KL034: { src: "images/places/KL034.jpg", alt: "Taman Tugu", creator: "Saintwong", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Spiral_ginger_plant_in_Taman_Tugu_20250827.jpg" },
    KL036: { src: "images/places/KL036.jpg", alt: "Kepong Metropolitan Park", creator: "Ahmad Rithauddin", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:The_lake_near_the_Kite_Flying_Kepong_Metropolitan_Park_Kuala_Lumpur_(6763398441).jpg" },
    KL037: { src: "images/places/KL037.jpg", alt: "TRX City Park", creator: "LegendaryLim", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:TRX_City_Park_at_The_Exchange_TRX_(23.12.02).jpg" },
    KL041: { src: "images/places/KL041.jpg", alt: "Central Market Kuala Lumpur", creator: "Jordiferrer", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Central_Market,_Kuala_Lumpur_01.JPG" },
    KL043: { src: "images/places/KL043.jpg", alt: "Suria KLCC", creator: "Marcin Konsek", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:2016_Kuala_Lumpur,_Suria_KLCC.jpg" },
    KL046: { src: "images/places/KL046.jpg", alt: "Berjaya Times Square", creator: "CEphoto, Uwe Aranas", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Kuala_Lumpur_Malaysia_Berjaya-Times-Square-01.jpg" },
    KL047: { src: "images/places/KL047.jpg", alt: "Sungei Wang Plaza", creator: "Azreey", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:KL_-_Sungei_Wang_Plaza_2022.jpg" },
    KL048: { src: "images/places/KL048.jpg", alt: "Lot 10 Kuala Lumpur", creator: "Brownc", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Lot_10_Kuala_Lumpur_View.jpg" },
    KL050: { src: "images/places/KL050.jpg", alt: "MyTOWN Shopping Centre", creator: "*angys*", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Interior_of_MyTown_Shopping_Centre.jpg" },
    KL051: { src: "images/places/KL051.jpg", alt: "Aquaria KLCC", creator: "Phalinn Ooi", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Underwater_tunnel_in_Aquaria_KLCC.jpg" },
    KL053: { src: "images/places/KL053.jpg", alt: "KL Tower Observation Deck", creator: "Danilo Mistroni", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:KL_Tower_Observation_Deck.jpg" },
    KL054: { src: "images/places/KL054.jpg", alt: "Berjaya Times Square Theme Park", creator: "Frostpolar", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Berjaya_Times_Square_Indoor_Amusement_Park_ft_Rollercoaster_@_Kuala_Lumpur,_Malaysia_(25).jpg" },
    KL057: { src: "images/places/KL057.jpg", alt: "Museum of Illusions Kuala Lumpur", creator: "Ruotailfoglio", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Gianni_Sarcone,_2001,_Master_of_Number,_mixed_media_-_collage,_76_x_76_cm,_Museum_of_Illusions,_Kuala_Lumpur.jpg" },
    KL059: { src: "images/places/KL059.jpg", alt: "Kwai Chai Hong", creator: "Renek78", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Kwai_Chai_Hong,_Kuala_Lumpur_in_May_2020_03.jpg" },
    KL012: { src: "images/places/KL012.jpg", alt: "Kampung Baru, Kuala Lumpur", creator: "Elisa.rolle", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Kampung_Baru,_Kuala_Lumpur,_2010.jpg" },
    KL016: { src: "images/places/KL016.jpg", alt: "Muzium Negara", creator: "Chainwit", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Muzium_Negara_Malaysia_KL_(2022-05).jpg" },
    KL019: { src: "images/places/KL019.jpg", alt: "National Art Gallery Malaysia", creator: "Gryffindor", license: "Public domain", source: "https://commons.wikimedia.org/wiki/File:Balai_Seni_Lukis_Negara_2007_13_pano.jpg" },
    KL022: { src: "images/places/KL022.jpg", alt: "Petronas Twin Towers", creator: "CEphoto, Uwe Aranas", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Kuala_Lumpur_Malaysia_Petronas-Twin-Towers-01.jpg" },
    KL027: { src: "images/places/KL027.jpg", alt: "Sri Mahamariamman Temple Kuala Lumpur", creator: "Philip Nalangan", license: "CC BY 4.0", source: "https://commons.wikimedia.org/wiki/File:Sri_Mahamariamman_Temple_Kuala_Lumpur.jpg" },
    KL033: { src: "images/places/KL033.jpg", alt: "KL Forest Eco Park canopy walk", creator: "RivieraBarnes", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:KL_Forest_Eco-Park_Canopy_Walk_9.jpg" },
    KL035: { src: "images/places/KL035.jpg", alt: "Titiwangsa Lake Gardens", creator: "Stefan Fussan", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Kuala_Lumpur_-_Titiwangsa_-_Panorama_0002.JPG" },
    KL038: { src: "images/places/KL038.jpg", alt: "Bukit Kiara Park", creator: "Slleong", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Bukit_Kiara_Park_2.jpg" },
    KL042: { src: "images/places/KL042.jpg", alt: "Petaling Street Kuala Lumpur", creator: "IQRemix", license: "CC BY-SA 2.0", source: "https://commons.wikimedia.org/wiki/File:Petaling_Street,_Kuala_Lumpur_01.jpg" },
    KL049: { src: "images/places/KL049.jpg", alt: "LaLaport Bukit Bintang City Centre", creator: "Renek78", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:LaLaport_BUKIT_BINTANG_CITY_CENTRE_in_2022-11_1.jpg" },
    KL052: { src: "images/places/KL052.jpg", alt: "F1 car exhibit at Petrosains", creator: "Simon_sees", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:F1_car_at_Petrosains_museum_(6349809786).jpg" }
};

// Context photos are reused for places located inside the pictured destination.
placeImages.KL002 = { ...placeImages.KL048, alt: "Lot 10, home of Hutong Food Court" };
placeImages.KL004 = { ...placeImages.KL043, alt: "Suria KLCC, location of Madam Kwan's" };
placeImages.KL008 = { ...placeImages.KL053, alt: "KL Tower, location of Atmosphere 360" };
placeImages.KL013 = { ...placeImages.KL041, alt: "Central Market, location of its food court" };
placeImages.KL045 = { ...placeImages.KL037, alt: "The Exchange TRX and its city park" };

// Photos supplied by the project owner. Add creator, licence, and source when known.
Object.assign(placeImages, {
    KL003: { src: "images/places/KL003.webp", alt: "TAPAK Urban Street Dining KLCC", creator: "Project-provided photo", license: "" },
    KL005: { src: "images/places/KL005.jpg", alt: "Bijan Bar & Restaurant", creator: "Project-provided photo", license: "" },
    KL006: { src: "images/places/KL006.png", alt: "Nasi Kandar Pelita KLCC", creator: "Project-provided photo", license: "" },
    KL007: { src: "images/places/KL007.jpg", alt: "Restoran Rebung Chef Ismail", creator: "Project-provided photo", license: "" },
    KL009: { src: "images/places/KL009.jpg", alt: "Old China Cafe", creator: "Project-provided photo", license: "" },
    KL010: { src: "images/places/KL010.jpg", alt: "Merchant's Lane", creator: "Project-provided photo", license: "" },
    KL011: { src: "images/places/KL011.jpeg", alt: "Limapulo: Baba Can Cook", creator: "Project-provided photo", license: "" },
    KL014: { src: "images/places/KL014.jpg", alt: "ICC Pudu Food Court", creator: "Project-provided photo", license: "" },
    KL030: { src: "images/places/KL030.webp", alt: "Kuala Lumpur City Gallery", creator: "Project-provided photo", license: "" },
    KL039: { src: "images/places/KL039.jpeg", alt: "Bukit Gasing Forest Park", creator: "Project-provided photo", license: "" },
    KL040: { src: "images/places/KL040.webp", alt: "Permaisuri Lake Gardens", creator: "Project-provided photo", license: "" },
    KL044: { src: "images/places/KL044.webp", alt: "Pavilion Kuala Lumpur", creator: "Project-provided photo", license: "" },
    KL055: { src: "images/places/KL055.jpg", alt: "SuperPark Malaysia", creator: "Project-provided photo", license: "" },
    KL056: { src: "images/places/KL056.jpg", alt: "Hauntu The LINC KL", creator: "Project-provided photo", license: "" },
    KL058: { src: "images/places/KL058.jpg", alt: "MinNature Malaysia", creator: "Project-provided photo", license: "" },
    KL060: { src: "images/places/KL060.jpg", alt: "REXKL", creator: "Project-provided photo", license: "" }
});
