from sqlalchemy import create_engine, Column, Integer, Boolean, BigInteger, DateTime, String, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.dialects.postgresql import ARRAY
from datetime import datetime

# Create a base class for declarative models
Base = declarative_base()

# https://docs.sqlalchemy.org/en/14/orm/inheritance.html

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    type = Column(String)

    __mapper_args__ = {
        "polymorphic_identity": "events",
        "polymorphic_on": type,
    }

class DotaMatch(Event):
	__tablename__ = "dota_matches"

	id = Column(Integer, ForeignKey("events.id"), primary_key=True)
	match_id = Column(BigInteger)
	player_slot = Column(Integer)
	radiant_win = Column(Boolean)
	duration = Column(Integer)
	game_mode = Column(Integer)
	lobby_type = Column(Integer)
	hero_id = Column(Integer)
	kills = Column(Integer)
	deaths = Column(Integer)
	assists = Column(Integer)
	level = Column(Integer)
	gold_per_min = Column(Integer)
	item_neutral = Column(Integer)
	start_time = Column(Integer)

	items = Column(ARRAY(Integer))
	won = Column(Boolean)

	__mapper_args__ = {
        "polymorphic_identity": "dota_matches",
    }

def create_session(db_url):
	# Create a SQLAlchemy engine
	engine = create_engine(db_url)

	# Create a session to interact with the database
	Session = sessionmaker(bind=engine)
	session = Session()

	# Create the table if it doesn't exist
	Base.metadata.create_all(engine)
	return session
