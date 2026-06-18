-- Topic IDs are local to one trained model and must not be assumed to match
-- canonical database topic IDs. Remove the bootstrap mappings created from
-- numeric ID equality so the NLP storage flow can resolve them safely.
DELETE FROM "topic_model_mappings"
WHERE "model_version" = 'bertopic-birch-v34-final-default';
