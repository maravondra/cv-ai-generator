# Architecture & Cloud Expertise: Marek Vondra

## Architectural Philosophy
Marek přistupuje k architektuře s důrazem na **skalovatelnost, bezpečnost, vysokou dostupnost a evoluční modernizaci**[cite: 1, 2]. Prosazuje principy API-First, jasného oddělení odpovědností (Separation of Concerns) a minimalizace vendor lock-in[cite: 1, 2].

---

## Key Enterprise Projects & Architectural Contributions

### 1. Magenta DMS (T-Systems International)
* **Role:** Tech Lead & Cloud Architect[cite: 1, 2]
* **Kontext:** Greenfield vývoj zcela nového cloud-native Dealer Management Systému, který vzniká jako strategická náhrada a transformace z historických legacy systémů (alphaX a iCla)[cite: 1].
* **People Leadership & Global Governance:**
  * **Vedení mezinárodních týmů:** Přímé technické a architektonické vedení 2 vývojových týmů v Indii (Offshore/Nearshore management, mentoring, nastavování standardů, code-reviews a kultivace inženýrské kultury na dálku).
  * **Project Board & Executive Leadership:** Aktivní reprezentace technického směřování a architektury na úrovni Projekt Boardu v Německu. Úzká spolupráce s německým managementem, Business Product Ownery a klíčovými stakeholdery na definici roadmapy, prioritizaci backlogu a řízení rizik.
* **Architektonické zásady & Přínos k transformaci:**
  * **Greenfield vs. Legacy Strategie:** Návrh moderní Target Architecture v cloudu bez historického balastu, při současné definici jasných migračních tras pro plynulý přechod stávajících zákazníků z legacy systémů[cite: 1].
  * **Interoperabilita během transformace:** Architektonický návrh vysoko-výkonného bidirekcionálního synchronizačního enginu, který zajišťuje konzistentní datový přenos mezi novým DMS, legacy databázemi a OEM platformami (Daimler Truck) v reálném čase[cite: 1].
  * **API-First & Microservices:** Definice architektury umožňující modulární nahrazování starých monolitických funkcí novými cloudovými mikroslužbami[cite: 1].
  
### 2. iCla & alphaX (T-Systems International)
* **Role:** Tech Lead & Cloud Architect[cite: 1, 2]
* **Kontext:** Architektonická garance, provozní stabilizace a příprava cloudové transformace pro klíčové enterprise aplikace (iCla jako centrální middleware v Open Telekom Cloud a alphaX jako robustní legacy Dealer Management System)[cite: 1, 2].
* **People Leadership & Team Empowerment:**
  * **Vedení menšího specializovaného týmu:** Přímé technické vedení a koordinace malého týmu vývojářů a DevOps inženýrů (3–5 lidí) odpovědných za vývoj, integraci a bezvýpadkový provoz middleware systémů.
  * **Mentoring & Nastavování standardů:** Osobní mentoring členů týmu, vedení code reviews, zavádění moderních architektonických standardů a podpora týmové autonomie při řešení komplexních technických výzev.
  * **Sponzorství technické kvality:** Nastavení procesů pro systematické snižování technického dluhu a zvyšování odbornosti týmu v oblasti cloud-native architektur (OTC/AWS) a container orchestrace[cite: 1, 2].
* **Architektonické zásady & Přínos k transformaci:**
  * **Cloud Transformation & Middleware Integration:** Architektonický návrh a garance řešení iCla jako centrální middleware platformy běžíci v Open Telekom Cloud (OTC) s vysokými požadavky na dostupnost a bezpečnost[cite: 1, 2].
  * **Modernizace & Stabilizace:** Postupná refaktorizace legacy monolitu alphaX, příprava rozhraní pro migraci dat na novou generaci (Magenta DMS) a implementace Zero Outage principů pro eliminaci kritických výpadků[cite: 1].
  * **API Architecture & Event Handling:** Návrh robustních API rozhraní a event-driven integračních toků mezi klientskými systémy a OEM partnery[cite: 1, 2].

### 3. Elsa2Go (T-Systems International)
* **Role:** Technický produktový owner & Cloud Architect (AWS)[cite: 1, 2]
* **Kontext:** Vývoj nové klientské cloud-native platformy na AWS pro Volkswagen, která nahrazuje a transformuje původní legacy aplikaci Elsa do moderní cloudové infrastruktury[cite: 1, 2].
* **People Leadership, AI Acceleration & Team Development:**
  * **Vedení a rozvoj týmu:** Přímé technické vedení cross-funkčního cloudu týmu, jeho rozvoj, mentování vývojářů a nastavování prostředí pro vysokou míru autonomie a týmové efektivity.
  * **AI-Driven Development Optimization:** Zavádění a optimalizace využívání AI nástrojů (AI coding agenti, Generativní AI) do každodenního vývojového cyklu týmu s cílem zrychlit doručování vlastností, zefektivnit code-reviews a zvýšit kvalitu kódové báze.
* **Architektonické zásady & Přínos k transformaci:**
  * **Legacy-to-Cloud Transformation:** Převzetí kompletní architektonické garance nad přechodem ze starého legacy systému na čistě cloudové AWS prostředí[cite: 1, 2].
  * **Cloud Health Check & Optimization:** Architektonické hodnocení řešení z pohledu bezpečnosti, nákladové efektivity, vysoké dostupnosti a AWS Well-Architected Frameworku[cite: 1, 2].
  * **Infrastructure as Code (IaC) & CI/CD:** Nastavení plně automatizovaných deployment pipelines pro rychlé doručování nových funkcí bez narušení SLA.

## Tech Stack & Tooling
* **AI, LLM & Agentic Engineering (AI Stack):**
  * **AI Coding Agenti & IDE:** Claude (Code / Anthropic), GitHub Copilot, OpenCode, Cursor.
  * **LLM Orchestration & Frameworks:** LangChain, LlamaIndex, AutoGen, CrewAI, Haystack.
  * **RAG & Vector Databases:** PostgreSQL (pgvector), Pinecone, Qdrant, ChromaDB, Embeddings (OpenAI / Cohere / Hugging Face).
  * **LLMOps, Evaluation & Observability:** LangSmith, LangFuse, Weights & Biases, Arize Phoenix, Prompt Governance, Cost & Latency Tracking.
  * **Model Deployment & APIs:** OpenAI API, Anthropic API, Ollama, Amazon Bedrock.

* **Cloud & Infrastructure:** Amazon Web Services (AWS), Open Telekom Cloud (OTC), Hybrid Cloud, Docker, Kubernetes, Helm, ArgoCD, Terraform, Ansible[cite: 1, 2].
* **Backend Frameworks:** Java (Spring Boot, Spring Batch, Apache Camel), Kotlin (Ktor), Python (FastAPI), Hibernate/JPA, REST APIs, OpenAPI, JMS, MQ[cite: 1, 2].
* **Databases & Storage:** PostgreSQL, SQL, Redis, Amazon S3, Relational & NoSQL databáze[cite: 1].
* **Observability & Security:** Grafana, Prometheus, Keycloak, SonarQube[cite: 2].
* **DevOps & CI/CD:** Maven, Git, Jenkins, ArgoCD, Infrastructure as Code (IaC)[cite: 1, 2].