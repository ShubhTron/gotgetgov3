-- Paddlescores Westchester club seed
-- Source: westchester.paddlescores.com
-- No geocoding needed — clubs shown by name search, not proximity

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'American Yacht Club', 'Rye', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'American Yacht Club' AND city = 'Rye');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Milbrook Club', 'Greenwich', 'CT', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Milbrook Club' AND city = 'Greenwich');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Mount Kisco Country Club', 'Mount Kisco', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Mount Kisco Country Club' AND city = 'Mount Kisco');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'New Rochelle Flint Paddle Club', 'New Rochelle', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'New Rochelle Flint Paddle Club' AND city = 'New Rochelle');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Orienta Beach Club', 'Mamaroneck', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Orienta Beach Club' AND city = 'Mamaroneck');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Bronxville Field Club', 'Bronxville', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Bronxville Field Club' AND city = 'Bronxville');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Scarsdale Golf Club', 'Scarsdale', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Scarsdale Golf Club' AND city = 'Scarsdale');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Amackassin Club', 'Yonkers', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Amackassin Club' AND city = 'Yonkers');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Ardsley Country Club', 'Ardsley-on-Hudson', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Ardsley Country Club' AND city = 'Ardsley-on-Hudson');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Bailiwick Club', 'Armonk', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Bailiwick Club' AND city = 'Armonk');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Beach Point Club', 'Mamaroneck', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Beach Point Club' AND city = 'Mamaroneck');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Bonnie Briar Country Club', 'Larchmont', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Bonnie Briar Country Club' AND city = 'Larchmont');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Brae Burn Country Club', 'Purchase', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Brae Burn Country Club' AND city = 'Purchase');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Century Country Club', 'Purchase', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Century Country Club' AND city = 'Purchase');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Coveleigh Club', 'Rye', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Coveleigh Club' AND city = 'Rye');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Fairview Country Club', 'Greenwich', 'CT', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Fairview Country Club' AND city = 'Greenwich');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Fox Meadow Tennis Club', 'Scarsdale', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Fox Meadow Tennis Club' AND city = 'Scarsdale');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Greenwich Field Club', 'Greenwich', 'CT', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Greenwich Field Club' AND city = 'Greenwich');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Larchmont Yacht Club', 'Larchmont', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Larchmont Yacht Club' AND city = 'Larchmont');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Manursing Island Club', 'Rye', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Manursing Island Club' AND city = 'Rye');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Metropolis Country Club', 'White Plains', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Metropolis Country Club' AND city = 'White Plains');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'New Rochelle Tennis Club', 'New Rochelle', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'New Rochelle Tennis Club' AND city = 'New Rochelle');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'New York Athletic Club', 'Pelham', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'New York Athletic Club' AND city = 'Pelham');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Pelham Country Club', 'Pelham Manor', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Pelham Country Club' AND city = 'Pelham Manor');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Pound Ridge Tennis Club', 'Pound Ridge', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Pound Ridge Tennis Club' AND city = 'Pound Ridge');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Shenorock Shore Club', 'Rye', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Shenorock Shore Club' AND city = 'Rye');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Siwanoy Country Club', 'Bronxville', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Siwanoy Country Club' AND city = 'Bronxville');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Sleepy Hollow Country Club', 'Scarborough', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Sleepy Hollow Country Club' AND city = 'Scarborough');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Sunningdale Country Club', 'Scarsdale', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Sunningdale Country Club' AND city = 'Scarsdale');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'The Apawamis Club', 'Rye', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'The Apawamis Club' AND city = 'Rye');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Waccabuc Country Club', 'Waccabuc', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Waccabuc Country Club' AND city = 'Waccabuc');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Westchester Country Club', 'Rye', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Westchester Country Club' AND city = 'Rye');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Whippoorwill Club', 'Armonk', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Whippoorwill Club' AND city = 'Armonk');

INSERT INTO clubs (name, city, state, source, sports)
SELECT 'Wykagyl Country Club', 'New Rochelle', 'NY', 'paddlescores', '{platform_tennis}'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Wykagyl Country Club' AND city = 'New Rochelle');
