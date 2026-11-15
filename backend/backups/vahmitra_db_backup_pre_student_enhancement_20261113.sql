--
-- PostgreSQL database dump
--

\restrict x2GX784Km1Rlt5xTSGbwwNEAa7GtexiQfmCHbqTfkrBj0baia6pnOUXe7K149yz

-- Dumped from database version 17.11 (Debian 17.11-0+deb13u1)
-- Dumped by pg_dump version 17.11 (Debian 17.11-0+deb13u1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: vahmitra_user
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO vahmitra_user;

--
-- Name: announcements; Type: TABLE; Schema: public; Owner: vahmitra_user
--

CREATE TABLE public.announcements (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    description character varying(2000) NOT NULL,
    category character varying(50) DEFAULT 'general'::character varying NOT NULL,
    priority character varying(30) DEFAULT 'normal'::character varying NOT NULL,
    is_pinned boolean DEFAULT false NOT NULL,
    route_id integer,
    published_by character varying(100) DEFAULT 'Campus Transport Office'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.announcements OWNER TO vahmitra_user;

--
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: vahmitra_user
--

CREATE SEQUENCE public.announcements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.announcements_id_seq OWNER TO vahmitra_user;

--
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vahmitra_user
--

ALTER SEQUENCE public.announcements_id_seq OWNED BY public.announcements.id;


--
-- Name: attendance; Type: TABLE; Schema: public; Owner: vahmitra_user
--

CREATE TABLE public.attendance (
    id integer NOT NULL,
    student_id integer NOT NULL,
    bus_allocation_id integer NOT NULL,
    boarding_time timestamp with time zone DEFAULT now() NOT NULL,
    verification_method character varying(30) NOT NULL
);


ALTER TABLE public.attendance OWNER TO vahmitra_user;

--
-- Name: attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: vahmitra_user
--

CREATE SEQUENCE public.attendance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_id_seq OWNER TO vahmitra_user;

--
-- Name: attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vahmitra_user
--

ALTER SEQUENCE public.attendance_id_seq OWNED BY public.attendance.id;


--
-- Name: bus_allocations; Type: TABLE; Schema: public; Owner: vahmitra_user
--

CREATE TABLE public.bus_allocations (
    id integer NOT NULL,
    bus_id integer NOT NULL,
    driver_id integer NOT NULL,
    route_id integer NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone,
    status character varying(30) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.bus_allocations OWNER TO vahmitra_user;

--
-- Name: bus_allocations_id_seq; Type: SEQUENCE; Schema: public; Owner: vahmitra_user
--

CREATE SEQUENCE public.bus_allocations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bus_allocations_id_seq OWNER TO vahmitra_user;

--
-- Name: bus_allocations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vahmitra_user
--

ALTER SEQUENCE public.bus_allocations_id_seq OWNED BY public.bus_allocations.id;


--
-- Name: bus_locations; Type: TABLE; Schema: public; Owner: vahmitra_user
--

CREATE TABLE public.bus_locations (
    id integer NOT NULL,
    bus_id integer NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    recorded_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.bus_locations OWNER TO vahmitra_user;

--
-- Name: bus_locations_id_seq; Type: SEQUENCE; Schema: public; Owner: vahmitra_user
--

CREATE SEQUENCE public.bus_locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bus_locations_id_seq OWNER TO vahmitra_user;

--
-- Name: bus_locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vahmitra_user
--

ALTER SEQUENCE public.bus_locations_id_seq OWNED BY public.bus_locations.id;


--
-- Name: buses; Type: TABLE; Schema: public; Owner: vahmitra_user
--

CREATE TABLE public.buses (
    id integer NOT NULL,
    bus_number character varying(30) NOT NULL,
    registration_number character varying(30) NOT NULL,
    capacity integer,
    is_active boolean
);


ALTER TABLE public.buses OWNER TO vahmitra_user;

--
-- Name: buses_id_seq; Type: SEQUENCE; Schema: public; Owner: vahmitra_user
--

CREATE SEQUENCE public.buses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.buses_id_seq OWNER TO vahmitra_user;

--
-- Name: buses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vahmitra_user
--

ALTER SEQUENCE public.buses_id_seq OWNED BY public.buses.id;


--
-- Name: complaints; Type: TABLE; Schema: public; Owner: vahmitra_user
--

CREATE TABLE public.complaints (
    id integer NOT NULL,
    student_id integer NOT NULL,
    title character varying(200) NOT NULL,
    category character varying(50) NOT NULL,
    description character varying(3000) NOT NULL,
    image_url character varying(500),
    status character varying(30) DEFAULT 'Submitted'::character varying NOT NULL,
    management_response character varying(3000),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.complaints OWNER TO vahmitra_user;

--
-- Name: complaints_id_seq; Type: SEQUENCE; Schema: public; Owner: vahmitra_user
--

CREATE SEQUENCE public.complaints_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.complaints_id_seq OWNER TO vahmitra_user;

--
-- Name: complaints_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vahmitra_user
--

ALTER SEQUENCE public.complaints_id_seq OWNED BY public.complaints.id;


--
-- Name: discussion_messages; Type: TABLE; Schema: public; Owner: vahmitra_user
--

CREATE TABLE public.discussion_messages (
    id integer NOT NULL,
    student_id integer NOT NULL,
    route_id integer,
    content character varying(2000) NOT NULL,
    is_reported boolean DEFAULT false NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.discussion_messages OWNER TO vahmitra_user;

--
-- Name: discussion_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: vahmitra_user
--

CREATE SEQUENCE public.discussion_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.discussion_messages_id_seq OWNER TO vahmitra_user;

--
-- Name: discussion_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vahmitra_user
--

ALTER SEQUENCE public.discussion_messages_id_seq OWNED BY public.discussion_messages.id;


--
-- Name: drivers; Type: TABLE; Schema: public; Owner: vahmitra_user
--

CREATE TABLE public.drivers (
    id integer NOT NULL,
    driver_name character varying(150) NOT NULL,
    phone character varying(20),
    license_number character varying(50),
    user_id integer,
    onboarding_code_hash character varying(255),
    onboarding_code_used boolean DEFAULT false NOT NULL
);


ALTER TABLE public.drivers OWNER TO vahmitra_user;

--
-- Name: drivers_id_seq; Type: SEQUENCE; Schema: public; Owner: vahmitra_user
--

CREATE SEQUENCE public.drivers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.drivers_id_seq OWNER TO vahmitra_user;

--
-- Name: drivers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vahmitra_user
--

ALTER SEQUENCE public.drivers_id_seq OWNED BY public.drivers.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: vahmitra_user
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    student_id integer NOT NULL,
    title character varying(200) NOT NULL,
    message character varying(1000) NOT NULL,
    category character varying(50) DEFAULT 'general'::character varying NOT NULL,
    priority character varying(30) DEFAULT 'normal'::character varying NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO vahmitra_user;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: vahmitra_user
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO vahmitra_user;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vahmitra_user
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: route_stops; Type: TABLE; Schema: public; Owner: vahmitra_user
--

CREATE TABLE public.route_stops (
    id integer NOT NULL,
    route_id integer NOT NULL,
    stop_name character varying(150) NOT NULL,
    sequence_number integer NOT NULL,
    latitude double precision,
    longitude double precision
);


ALTER TABLE public.route_stops OWNER TO vahmitra_user;

--
-- Name: route_stops_id_seq; Type: SEQUENCE; Schema: public; Owner: vahmitra_user
--

CREATE SEQUENCE public.route_stops_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.route_stops_id_seq OWNER TO vahmitra_user;

--
-- Name: route_stops_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vahmitra_user
--

ALTER SEQUENCE public.route_stops_id_seq OWNED BY public.route_stops.id;


--
-- Name: routes; Type: TABLE; Schema: public; Owner: vahmitra_user
--

CREATE TABLE public.routes (
    id integer NOT NULL,
    route_code character varying(30) NOT NULL,
    route_name character varying(150) NOT NULL,
    start_point character varying(150),
    end_point character varying(150),
    is_active boolean,
    area character varying(50) NOT NULL
);


ALTER TABLE public.routes OWNER TO vahmitra_user;

--
-- Name: routes_id_seq; Type: SEQUENCE; Schema: public; Owner: vahmitra_user
--

CREATE SEQUENCE public.routes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.routes_id_seq OWNER TO vahmitra_user;

--
-- Name: routes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vahmitra_user
--

ALTER SEQUENCE public.routes_id_seq OWNED BY public.routes.id;


--
-- Name: student_route_assignments; Type: TABLE; Schema: public; Owner: vahmitra_user
--

CREATE TABLE public.student_route_assignments (
    id integer NOT NULL,
    student_id integer NOT NULL,
    route_id integer NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone,
    status character varying(30) NOT NULL
);


ALTER TABLE public.student_route_assignments OWNER TO vahmitra_user;

--
-- Name: student_route_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: vahmitra_user
--

CREATE SEQUENCE public.student_route_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.student_route_assignments_id_seq OWNER TO vahmitra_user;

--
-- Name: student_route_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vahmitra_user
--

ALTER SEQUENCE public.student_route_assignments_id_seq OWNED BY public.student_route_assignments.id;


--
-- Name: students; Type: TABLE; Schema: public; Owner: vahmitra_user
--

CREATE TABLE public.students (
    id integer NOT NULL,
    registration_number character varying(50) NOT NULL,
    full_name character varying(150) NOT NULL,
    email character varying(150),
    phone character varying(20),
    user_id integer,
    onboarding_code_hash character varying(255),
    onboarding_code_used boolean DEFAULT false NOT NULL,
    nickname character varying(50),
    profile_photo_url character varying(500),
    department character varying(100),
    academic_year character varying(50)
);


ALTER TABLE public.students OWNER TO vahmitra_user;

--
-- Name: students_id_seq; Type: SEQUENCE; Schema: public; Owner: vahmitra_user
--

CREATE SEQUENCE public.students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.students_id_seq OWNER TO vahmitra_user;

--
-- Name: students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vahmitra_user
--

ALTER SEQUENCE public.students_id_seq OWNED BY public.students.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: vahmitra_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(30) NOT NULL,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO vahmitra_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: vahmitra_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO vahmitra_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vahmitra_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: announcements id; Type: DEFAULT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.announcements ALTER COLUMN id SET DEFAULT nextval('public.announcements_id_seq'::regclass);


--
-- Name: attendance id; Type: DEFAULT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.attendance ALTER COLUMN id SET DEFAULT nextval('public.attendance_id_seq'::regclass);


--
-- Name: bus_allocations id; Type: DEFAULT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.bus_allocations ALTER COLUMN id SET DEFAULT nextval('public.bus_allocations_id_seq'::regclass);


--
-- Name: bus_locations id; Type: DEFAULT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.bus_locations ALTER COLUMN id SET DEFAULT nextval('public.bus_locations_id_seq'::regclass);


--
-- Name: buses id; Type: DEFAULT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.buses ALTER COLUMN id SET DEFAULT nextval('public.buses_id_seq'::regclass);


--
-- Name: complaints id; Type: DEFAULT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.complaints ALTER COLUMN id SET DEFAULT nextval('public.complaints_id_seq'::regclass);


--
-- Name: discussion_messages id; Type: DEFAULT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.discussion_messages ALTER COLUMN id SET DEFAULT nextval('public.discussion_messages_id_seq'::regclass);


--
-- Name: drivers id; Type: DEFAULT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.drivers ALTER COLUMN id SET DEFAULT nextval('public.drivers_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: route_stops id; Type: DEFAULT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.route_stops ALTER COLUMN id SET DEFAULT nextval('public.route_stops_id_seq'::regclass);


--
-- Name: routes id; Type: DEFAULT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.routes ALTER COLUMN id SET DEFAULT nextval('public.routes_id_seq'::regclass);


--
-- Name: student_route_assignments id; Type: DEFAULT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.student_route_assignments ALTER COLUMN id SET DEFAULT nextval('public.student_route_assignments_id_seq'::regclass);


--
-- Name: students id; Type: DEFAULT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.students ALTER COLUMN id SET DEFAULT nextval('public.students_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: vahmitra_user
--

COPY public.alembic_version (version_num) FROM stdin;
9a1b2c3d4e5f
\.


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: vahmitra_user
--

COPY public.announcements (id, title, description, category, priority, is_pinned, route_id, published_by, created_at) FROM stdin;
\.


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: vahmitra_user
--

COPY public.attendance (id, student_id, bus_allocation_id, boarding_time, verification_method) FROM stdin;
\.


--
-- Data for Name: bus_allocations; Type: TABLE DATA; Schema: public; Owner: vahmitra_user
--

COPY public.bus_allocations (id, bus_id, driver_id, route_id, start_date, end_date, status, created_at) FROM stdin;
1	1	2	1	2026-11-13 02:30:00+00	\N	active	2026-11-12 17:44:37.527835+00
2	2	3	2	2026-11-13 21:46:22.539993+00	\N	active	2026-11-13 21:46:22.575114+00
\.


--
-- Data for Name: bus_locations; Type: TABLE DATA; Schema: public; Owner: vahmitra_user
--

COPY public.bus_locations (id, bus_id, latitude, longitude, recorded_at) FROM stdin;
\.


--
-- Data for Name: buses; Type: TABLE DATA; Schema: public; Owner: vahmitra_user
--

COPY public.buses (id, bus_number, registration_number, capacity, is_active) FROM stdin;
1	BUS-DEMO-001	AP39DEMO0001	50	t
2	12	AP 16 TZ 4512	54	t
\.


--
-- Data for Name: complaints; Type: TABLE DATA; Schema: public; Owner: vahmitra_user
--

COPY public.complaints (id, student_id, title, category, description, image_url, status, management_response, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: discussion_messages; Type: TABLE DATA; Schema: public; Owner: vahmitra_user
--

COPY public.discussion_messages (id, student_id, route_id, content, is_reported, is_deleted, created_at) FROM stdin;
1	2	2	hiii	f	f	2026-11-13 22:10:42.780825+00
\.


--
-- Data for Name: drivers; Type: TABLE DATA; Schema: public; Owner: vahmitra_user
--

COPY public.drivers (id, driver_name, phone, license_number, user_id, onboarding_code_hash, onboarding_code_used) FROM stdin;
1	Test Driver	9876543210	TESTDL2026001	3	\N	f
2	Test Driver	9876543210	TESTDL2026002	4	\N	f
3	Ramesh Kumar	+91 98480 12345	AP16-2021-009876	5	\N	f
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: vahmitra_user
--

COPY public.notifications (id, student_id, title, message, category, priority, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: route_stops; Type: TABLE DATA; Schema: public; Owner: vahmitra_user
--

COPY public.route_stops (id, route_id, stop_name, sequence_number, latitude, longitude) FROM stdin;
1	1	Benz Circle	1	16.5062	80.648
2	1	Poranki	2	16.477	80.712
\.


--
-- Data for Name: routes; Type: TABLE DATA; Schema: public; Owner: vahmitra_user
--

COPY public.routes (id, route_code, route_name, start_point, end_point, is_active, area) FROM stdin;
1	RTE-001	Vijayawada Route	Vijayawada	SRM University AP	t	Vijayawada
2	G-9	Guntur — Vidyanagar Line	Vidyanagar 1st Line	SRM University AP	t	Guntur
\.


--
-- Data for Name: student_route_assignments; Type: TABLE DATA; Schema: public; Owner: vahmitra_user
--

COPY public.student_route_assignments (id, student_id, route_id, start_date, end_date, status) FROM stdin;
1	2	2	2026-11-13 21:46:22.539993+00	\N	active
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: vahmitra_user
--

COPY public.students (id, registration_number, full_name, email, phone, user_id, onboarding_code_hash, onboarding_code_used, nickname, profile_photo_url, department, academic_year) FROM stdin;
1	TEST2026001	Test Student	teststudent001@example.com	9876543210	2	\N	f	\N	\N	\N	\N
2	AP24110010568	Deepak Sunkara	deepak_sunkara@srmap.edu.in	+91 91234 56789	6	\N	f	Deepak	\N	Computer Science & Engineering	AY 2024-2028
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: vahmitra_user
--

COPY public.users (id, username, password_hash, role, is_active, created_at) FROM stdin;
3	testdriver001	$argon2id$v=19$m=65536,t=3,p=4$we7YokbrWAMeFoQP3AIvJQ$vsKjJs3zUJwxAhalISc9eGtYYT/AwayRW1skwTpch0w	driver	t	2026-11-12 14:59:26.303145+00
4	testdriver002	$argon2id$v=19$m=65536,t=3,p=4$pxk4ZR3TQB0YG5tbVD58Dg$izaxJxxTdxTCRSbFtIIDFHslAcHmxVBLq6TRMJTM58s	driver	t	2026-11-12 14:59:52.041928+00
2	teststudent001	$argon2id$v=19$m=65536,t=3,p=4$3sjiu92nVwMTYQaVmJVS6A$r5Sm4uSTn+2HEE1czxwjFuUmAM0lT+U7TjJOvxE5FCw	student	t	2026-11-12 14:10:06.358481+00
6	student_srmap	$argon2id$v=19$m=65536,t=3,p=4$Vw9OpCLzyMxTt7nkwaSzDw$lypNHEtY3IVT/109L63pn4iEtkf9DngmExU524bG84w	student	t	2026-11-13 21:46:22.575114+00
1	srmap@vahmitra	$argon2id$v=19$m=65536,t=3,p=4$gtQPAkrIMnxyytjCIcKpWA$lqWt23Yxsym9JwO2Da/v/BO480jXCLjfEZZwIoNCyvo	management	t	2026-11-11 20:34:51.092089+00
5	driver_srmap	$argon2id$v=19$m=65536,t=3,p=4$KLJuahQME+QaRO7rgA6BPQ$o/hW+2m2yhQW4pHJ6HxnsXVAmbuDBz70uG7emo1QkWQ	driver	t	2026-11-13 21:46:22.575114+00
\.


--
-- Name: announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vahmitra_user
--

SELECT pg_catalog.setval('public.announcements_id_seq', 1, false);


--
-- Name: attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vahmitra_user
--

SELECT pg_catalog.setval('public.attendance_id_seq', 1, false);


--
-- Name: bus_allocations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vahmitra_user
--

SELECT pg_catalog.setval('public.bus_allocations_id_seq', 2, true);


--
-- Name: bus_locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vahmitra_user
--

SELECT pg_catalog.setval('public.bus_locations_id_seq', 1, false);


--
-- Name: buses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vahmitra_user
--

SELECT pg_catalog.setval('public.buses_id_seq', 2, true);


--
-- Name: complaints_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vahmitra_user
--

SELECT pg_catalog.setval('public.complaints_id_seq', 1, false);


--
-- Name: discussion_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vahmitra_user
--

SELECT pg_catalog.setval('public.discussion_messages_id_seq', 1, true);


--
-- Name: drivers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vahmitra_user
--

SELECT pg_catalog.setval('public.drivers_id_seq', 3, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vahmitra_user
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: route_stops_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vahmitra_user
--

SELECT pg_catalog.setval('public.route_stops_id_seq', 2, true);


--
-- Name: routes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vahmitra_user
--

SELECT pg_catalog.setval('public.routes_id_seq', 2, true);


--
-- Name: student_route_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vahmitra_user
--

SELECT pg_catalog.setval('public.student_route_assignments_id_seq', 1, true);


--
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vahmitra_user
--

SELECT pg_catalog.setval('public.students_id_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vahmitra_user
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: bus_allocations bus_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.bus_allocations
    ADD CONSTRAINT bus_allocations_pkey PRIMARY KEY (id);


--
-- Name: bus_locations bus_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.bus_locations
    ADD CONSTRAINT bus_locations_pkey PRIMARY KEY (id);


--
-- Name: buses buses_bus_number_key; Type: CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.buses
    ADD CONSTRAINT buses_bus_number_key UNIQUE (bus_number);


--
-- Name: buses buses_pkey; Type: CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.buses
    ADD CONSTRAINT buses_pkey PRIMARY KEY (id);


--
-- Name: buses buses_registration_number_key; Type: CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.buses
    ADD CONSTRAINT buses_registration_number_key UNIQUE (registration_number);


--
-- Name: complaints complaints_pkey; Type: CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_pkey PRIMARY KEY (id);


--
-- Name: discussion_messages discussion_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.discussion_messages
    ADD CONSTRAINT discussion_messages_pkey PRIMARY KEY (id);


--
-- Name: drivers drivers_license_number_key; Type: CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_license_number_key UNIQUE (license_number);


--
-- Name: drivers drivers_pkey; Type: CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: route_stops route_stops_pkey; Type: CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.route_stops
    ADD CONSTRAINT route_stops_pkey PRIMARY KEY (id);


--
-- Name: routes routes_pkey; Type: CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT routes_pkey PRIMARY KEY (id);


--
-- Name: student_route_assignments student_route_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.student_route_assignments
    ADD CONSTRAINT student_route_assignments_pkey PRIMARY KEY (id);


--
-- Name: students students_email_key; Type: CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_email_key UNIQUE (email);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: students students_registration_number_key; Type: CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_registration_number_key UNIQUE (registration_number);


--
-- Name: drivers uq_drivers_user_id; Type: CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT uq_drivers_user_id UNIQUE (user_id);


--
-- Name: routes uq_route_area_code; Type: CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT uq_route_area_code UNIQUE (area, route_code);


--
-- Name: route_stops uq_route_stop_sequence; Type: CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.route_stops
    ADD CONSTRAINT uq_route_stop_sequence UNIQUE (route_id, sequence_number);


--
-- Name: students uq_students_user_id; Type: CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT uq_students_user_id UNIQUE (user_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: ix_announcements_id; Type: INDEX; Schema: public; Owner: vahmitra_user
--

CREATE INDEX ix_announcements_id ON public.announcements USING btree (id);


--
-- Name: ix_attendance_id; Type: INDEX; Schema: public; Owner: vahmitra_user
--

CREATE INDEX ix_attendance_id ON public.attendance USING btree (id);


--
-- Name: ix_bus_allocations_id; Type: INDEX; Schema: public; Owner: vahmitra_user
--

CREATE INDEX ix_bus_allocations_id ON public.bus_allocations USING btree (id);


--
-- Name: ix_bus_locations_id; Type: INDEX; Schema: public; Owner: vahmitra_user
--

CREATE INDEX ix_bus_locations_id ON public.bus_locations USING btree (id);


--
-- Name: ix_buses_id; Type: INDEX; Schema: public; Owner: vahmitra_user
--

CREATE INDEX ix_buses_id ON public.buses USING btree (id);


--
-- Name: ix_complaints_id; Type: INDEX; Schema: public; Owner: vahmitra_user
--

CREATE INDEX ix_complaints_id ON public.complaints USING btree (id);


--
-- Name: ix_discussion_messages_id; Type: INDEX; Schema: public; Owner: vahmitra_user
--

CREATE INDEX ix_discussion_messages_id ON public.discussion_messages USING btree (id);


--
-- Name: ix_drivers_id; Type: INDEX; Schema: public; Owner: vahmitra_user
--

CREATE INDEX ix_drivers_id ON public.drivers USING btree (id);


--
-- Name: ix_notifications_id; Type: INDEX; Schema: public; Owner: vahmitra_user
--

CREATE INDEX ix_notifications_id ON public.notifications USING btree (id);


--
-- Name: ix_route_stops_id; Type: INDEX; Schema: public; Owner: vahmitra_user
--

CREATE INDEX ix_route_stops_id ON public.route_stops USING btree (id);


--
-- Name: ix_routes_id; Type: INDEX; Schema: public; Owner: vahmitra_user
--

CREATE INDEX ix_routes_id ON public.routes USING btree (id);


--
-- Name: ix_student_route_assignments_id; Type: INDEX; Schema: public; Owner: vahmitra_user
--

CREATE INDEX ix_student_route_assignments_id ON public.student_route_assignments USING btree (id);


--
-- Name: ix_students_id; Type: INDEX; Schema: public; Owner: vahmitra_user
--

CREATE INDEX ix_students_id ON public.students USING btree (id);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: vahmitra_user
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: announcements announcements_route_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.routes(id) ON DELETE SET NULL;


--
-- Name: attendance attendance_bus_allocation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_bus_allocation_id_fkey FOREIGN KEY (bus_allocation_id) REFERENCES public.bus_allocations(id);


--
-- Name: attendance attendance_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: bus_allocations bus_allocations_bus_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.bus_allocations
    ADD CONSTRAINT bus_allocations_bus_id_fkey FOREIGN KEY (bus_id) REFERENCES public.buses(id);


--
-- Name: bus_allocations bus_allocations_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.bus_allocations
    ADD CONSTRAINT bus_allocations_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id);


--
-- Name: bus_allocations bus_allocations_route_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.bus_allocations
    ADD CONSTRAINT bus_allocations_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.routes(id);


--
-- Name: bus_locations bus_locations_bus_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.bus_locations
    ADD CONSTRAINT bus_locations_bus_id_fkey FOREIGN KEY (bus_id) REFERENCES public.buses(id) ON DELETE CASCADE;


--
-- Name: complaints complaints_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: discussion_messages discussion_messages_route_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.discussion_messages
    ADD CONSTRAINT discussion_messages_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.routes(id) ON DELETE SET NULL;


--
-- Name: discussion_messages discussion_messages_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.discussion_messages
    ADD CONSTRAINT discussion_messages_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: drivers fk_drivers_user_id_users; Type: FK CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT fk_drivers_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: students fk_students_user_id_users; Type: FK CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT fk_students_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: route_stops route_stops_route_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.route_stops
    ADD CONSTRAINT route_stops_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.routes(id) ON DELETE CASCADE;


--
-- Name: student_route_assignments student_route_assignments_route_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.student_route_assignments
    ADD CONSTRAINT student_route_assignments_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.routes(id);


--
-- Name: student_route_assignments student_route_assignments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vahmitra_user
--

ALTER TABLE ONLY public.student_route_assignments
    ADD CONSTRAINT student_route_assignments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- PostgreSQL database dump complete
--

\unrestrict x2GX784Km1Rlt5xTSGbwwNEAa7GtexiQfmCHbqTfkrBj0baia6pnOUXe7K149yz

