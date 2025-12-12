# Database Schema Reference

## Brands Table (`public.brands`)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated UUID |
| name | text | Brand name (unique) |
| tier | USER-DEFINED | Brand tier type (default: 'Designer') |
| logo_url | text | URL to brand logo |
| website_url | text | URL to brand website |
| created_at | timestamp | Creation timestamp (UTC) |
| brand_color | varchar | Brand color hex code (default: '#000000') |

## Comments Table (`public.comments`)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated UUID |
| user_id | uuid | Foreign key to users table |
| perfume_id | uuid | Foreign key to perfumes table |
| content | text | Comment content |
| user_name | text | User's display name |
| created_at | timestamp | Creation timestamp |

## Notes Table (`public.notes`)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated UUID |
| name | text | Note name (unique) |
| family | text | Note family/category |
| color_hex | varchar | Color representation |
| description | text | Note description |
| created_at | timestamp | Creation timestamp (UTC) |
| volatility | text | Volatility level (Top/Heart/Base) |
| default_intensity | integer | Default intensity (1-10) |

## Perfume Dupes Table (`public.perfume_dupes`)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated UUID |
| original_id | uuid | Foreign key to original perfume |
| dupe_id | uuid | Foreign key to dupe perfume |
| similarity_rating | integer | Similarity rating |
| price_difference | text | Price difference description |
| votes | integer | Number of votes (default: 0) |

## Perfume Notes Table (`public.perfume_notes`)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated UUID |
| perfume_id | uuid | Foreign key to perfumes table |
| note_id | uuid | Foreign key to notes table |
| type | USER-DEFINED | Note type |
| prominence_score | integer | Prominence score (1-10) |

## Perfumes Table (`public.perfumes`)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated UUID |
| name | text | Perfume name (unique) |
| brand_id | uuid | Foreign key to brands table |
| gender | USER-DEFINED | Gender type (default: 'Unisex') |
| concentration | USER-DEFINED | Perfume concentration |
| release_year | integer | Release year |
| image_url | text | Perfume image URL |
| vibe_tags | ARRAY | Associated vibe tags |
| embedding | USER-DEFINED | Perfume embedding |
| created_at | timestamp | Creation timestamp (UTC) |
| perfumer | text | Perfumer name |
| price_tier | varchar | Price tier |
| best_season | ARRAY | Best seasons |
| best_time | varchar | Best time of day |
| longevity_rating | integer | Longevity rating (default: 0) |
| sillage_rating | integer | Sillage rating (default: 0) |
| rating | numeric | Overall rating |
| scenario | text | Usage scenario |
| scent_profile | jsonb | Scent profile characteristics |
| occasions | ARRAY | Suitable occasions |

## Profiles Table (`public.profiles`)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, matches users table |
| display_name | text | User's display name |
| bio | text | User biography |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |
| signature_scent_id | uuid | Foreign key to perfumes table |
| favorite_notes | ARRAY | Favorite notes (default: empty array) |
| vibe_tags | ARRAY | User's vibe tags |
| best_season | text | User's best season |

## Reviews Table (`public.reviews`)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated UUID |
| perfume_id | uuid | Foreign key to perfumes table |
| user_id | uuid | Foreign key to users table |
| rating | numeric | Rating (0.5-5.0) |
| longevity | integer | Longevity score (1-5) |
| sillage | integer | Sillage score (1-5) |
| text_content | text | Review text |
| created_at | timestamp | Creation timestamp (UTC) |

## Saved Mixes Table (`public.saved_mixes`)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated UUID |
| user_id | uuid | Foreign key to users table |
| base_perfume_id | uuid | Foreign key to base perfume |
| top_perfume_id | uuid | Foreign key to top perfume |
| mix_ratio | integer | Mix ratio (default: 50) |
| mix_name | text | Mix name |
| created_at | timestamp | Creation timestamp |

## User Collections Table (`public.user_collections`)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated UUID |
| user_id | uuid | Foreign key to users table |
| perfume_id | uuid | Foreign key to perfumes table |
| created_at | timestamp | Creation timestamp |