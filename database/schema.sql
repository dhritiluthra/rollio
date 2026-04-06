-- Table: public.users

-- DROP TABLE IF EXISTS public.users;

CREATE TABLE IF NOT EXISTS public.users
(
    id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    name text COLLATE pg_catalog."default" NOT NULL,
    email text COLLATE pg_catalog."default" NOT NULL,
    password_hash text COLLATE pg_catalog."default" NOT NULL,
    role text COLLATE pg_catalog."default" DEFAULT 'user'::text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT role_check CHECK (role = ANY (ARRAY['user'::text, 'vendor'::text]))
)

    
-- Table: public.carts

-- DROP TABLE IF EXISTS public.carts;

CREATE TABLE IF NOT EXISTS public.carts
(
    id integer NOT NULL DEFAULT nextval('carts_id_seq'::regclass),
    name text COLLATE pg_catalog."default" NOT NULL,
    description text COLLATE pg_catalog."default",
    owner_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT false,
    image_url text,
    CONSTRAINT carts_pkey PRIMARY KEY (id),
    CONSTRAINT carts_owner_id_fkey FOREIGN KEY (owner_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

-- Table: public.cart_locations

-- DROP TABLE IF EXISTS public.cart_locations;

CREATE TABLE IF NOT EXISTS public.cart_locations
(
    id integer NOT NULL DEFAULT nextval('cart_locations_id_seq'::regclass),
    cart_id integer,
    latitude numeric,
    longitude numeric,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cart_locations_pkey PRIMARY KEY (id),
    CONSTRAINT one_location_per_cart UNIQUE (cart_id),
    CONSTRAINT cart_locations_cart_id_fkey FOREIGN KEY (cart_id)
        REFERENCES public.carts (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)


-- Table: public.food_items

-- DROP TABLE IF EXISTS public.food_items;

CREATE TABLE IF NOT EXISTS public.food_items
(
    id integer NOT NULL DEFAULT nextval('food_items_id_seq'::regclass),
    cart_id integer,
    name text COLLATE pg_catalog."default" NOT NULL,
    price numeric,
    description text COLLATE pg_catalog."default",
    is_available boolean DEFAULT true,
	  category text,
    CONSTRAINT food_items_pkey PRIMARY KEY (id),
    CONSTRAINT food_items_cart_id_fkey FOREIGN KEY (cart_id)
        REFERENCES public.carts (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)
