ALTER TABLE "destinations"
ADD CONSTRAINT "destinations_category_check"
CHECK (
    "category" IN (
        'alam',
        'pantai',
        'budaya',
        'sejarah',
        'kuliner',
        'religi',
        'keluarga',
        'petualangan',
        'edukasi',
        'belanja'
    )
) NOT VALID;
