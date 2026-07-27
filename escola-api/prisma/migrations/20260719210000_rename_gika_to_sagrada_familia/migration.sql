-- Rename legacy unit "Gika" to the canonical public name "Sagrada Família".
UPDATE `Unit`
SET
  `name` = 'Sagrada Família',
  `address` = 'Av. Cmte. Gika 150, Sagrada Família, Luanda',
  `active` = true
WHERE `name` = 'Gika';
