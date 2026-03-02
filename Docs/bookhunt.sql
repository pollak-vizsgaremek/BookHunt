CREATE DATABASE IF NOT EXISTS bookhunt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bookhunt;

DROP TABLE IF EXISTS AR_TORTENET;
DROP TABLE IF EXISTS ARAK;
DROP TABLE IF EXISTS FELJEGYZES;
DROP TABLE IF EXISTS TERMEK;
DROP TABLE IF EXISTS KEDVENCEK;
DROP TABLE IF EXISTS KERES;
DROP TABLE IF EXISTS FELHASZNALO;
DROP TABLE IF EXISTS WEBARUHAZ;

CREATE TABLE FELHASZNALO (
    felhasznalo_id INT AUTO_INCREMENT PRIMARY KEY,
    jelszo VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    felhasznalonev VARCHAR(100) NOT NULL UNIQUE,
    INDEX idx_email (email),
    INDEX idx_felhasznalonev (felhasznalonev)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE WEBARUHAZ (
    webaruhaz_id INT AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(500) NOT NULL UNIQUE,
    nev VARCHAR(255) NOT NULL,
    INDEX idx_url (url)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE TERMEK (
    termek_id INT AUTO_INCREMENT PRIMARY KEY,
    cim VARCHAR(500) NOT NULL,
    tipus ENUM('konyv', 'e-konyv', 'manga', 'kepregeny') NOT NULL,
    szerzo VARCHAR(255),
    isbn_issn VARCHAR(20),
    INDEX idx_tipus (tipus),
    INDEX idx_szerzo (szerzo),
    INDEX idx_isbn_issn (isbn_issn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE KERES (
    keres_id INT AUTO_INCREMENT PRIMARY KEY,
    felhasznalo_id INT NOT NULL,
    webaruhaz_id INT NOT NULL,
    FOREIGN KEY (felhasznalo_id) REFERENCES FELHASZNALO(felhasznalo_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (webaruhaz_id) REFERENCES WEBARUHAZ(webaruhaz_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_felhasznalo (felhasznalo_id),
    INDEX idx_webaruhaz (webaruhaz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE KEDVENCEK (
    kedvencek_id INT AUTO_INCREMENT PRIMARY KEY,
    felhasznalo_id INT NOT NULL,
    termek_id INT NOT NULL,
    FOREIGN KEY (felhasznalo_id) REFERENCES FELHASZNALO(felhasznalo_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (termek_id) REFERENCES TERMEK(termek_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_kedvenc (felhasznalo_id, termek_id),
    INDEX idx_felhasznalo (felhasznalo_id),
    INDEX idx_termek (termek_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE FELJEGYZES (
    feljegyzes_id INT AUTO_INCREMENT PRIMARY KEY,
    termek_id INT NOT NULL,
    webaruhaz_id INT NOT NULL,
    FOREIGN KEY (termek_id) REFERENCES TERMEK(termek_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (webaruhaz_id) REFERENCES WEBARUHAZ(webaruhaz_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_feljegyzes (termek_id, webaruhaz_id),
    INDEX idx_termek (termek_id),
    INDEX idx_webaruhaz (webaruhaz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ARAK (
    arak_id INT AUTO_INCREMENT PRIMARY KEY,
    kedvencek_id INT NOT NULL,
    webaruhaz_id INT NOT NULL,
    last_known_price DECIMAL(10, 2),
    FOREIGN KEY (kedvencek_id) REFERENCES KEDVENCEK(kedvencek_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (webaruhaz_id) REFERENCES WEBARUHAZ(webaruhaz_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_kedvencek (kedvencek_id),
    INDEX idx_webaruhaz (webaruhaz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE AR_TORTENET (
    ar_id INT AUTO_INCREMENT PRIMARY KEY,
    feljegyzes_id INT NOT NULL,
    ar DECIMAL(10, 2) NOT NULL,
    datum DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feljegyzes_id) REFERENCES FELJEGYZES(feljegyzes_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_feljegyzes (feljegyzes_id),
    INDEX idx_datum (datum)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO FELHASZNALO (jelszo, email, felhasznalonev) VALUES
('$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teszt@example.com', 'teszt_user'),
('$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'anna@example.com', 'anna_konyv');

INSERT INTO WEBARUHAZ (url, nev) VALUES
('https://www.libri.hu', 'Libri Könyvesbolt'),
('https://www.bookline.hu', 'Bookline'),
('https://www.amazon.com', 'Amazon');

INSERT INTO TERMEK (cim, tipus, szerzo, isbn_issn) VALUES
('A Gyűrűk Ura', 'konyv', 'J.R.R. Tolkien', '9789632451234'),
('Harry Potter és a bölcsek köve', 'e-konyv', 'J.K. Rowling', '9789633245678'),
('One Piece 1. kötet', 'manga', 'Eiichiro Oda', '9789631234567'),
('Batman: The Killing Joke', 'kepregeny', 'Alan Moore', '9781401234567');

INSERT INTO KERES (felhasznalo_id, webaruhaz_id) VALUES
(1, 1), (1, 2), (2, 1);

INSERT INTO KEDVENCEK (felhasznalo_id, termek_id) VALUES
(1, 1), (1, 3), (2, 2), (2, 4);

INSERT INTO FELJEGYZES (termek_id, webaruhaz_id) VALUES
(1, 1), (1, 2), (2, 3), (3, 1), (4, 2);

INSERT INTO ARAK (kedvencek_id, webaruhaz_id, last_known_price) VALUES
(1, 1, 4500.00), (1, 2, 4200.00), (2, 1, 3800.00);

INSERT INTO AR_TORTENET (feljegyzes_id, ar, datum) VALUES
(1, 4500.00, '2024-10-01 10:00:00'),
(1, 4400.00, '2024-10-15 14:30:00'),
(2, 4200.00, '2024-10-01 11:00:00'),
(3, 3800.00, '2024-10-05 09:00:00');
