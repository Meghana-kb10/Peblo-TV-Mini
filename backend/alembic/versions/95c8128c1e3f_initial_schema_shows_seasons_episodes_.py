"""initial_schema_shows_seasons_episodes_artwork_publish_runs

Revision ID: 95c8128c1e3f
Revises: 
Create Date: 2026-09-08 13:32:21.023592

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '95c8128c1e3f'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Shows table
    op.create_table(
        'shows',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('section', sa.String(length=50), nullable=True),
        sa.Column('categories', sa.JSON(), nullable=False),
        sa.Column('synopsis', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_shows_slug', 'shows', ['slug'], unique=True)
    op.create_index('ix_shows_title', 'shows', ['title'])
    op.create_index('ix_shows_section', 'shows', ['section'])

    # 2. Seasons table
    op.create_table(
        'seasons',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('show_id', sa.String(length=36), sa.ForeignKey('shows.id', ondelete='CASCADE'), nullable=False),
        sa.Column('season_number', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_seasons_show_id', 'seasons', ['show_id'])

    # 3. Episodes table
    op.create_table(
        'episodes',
        sa.Column('id', sa.String(length=50), primary_key=True),
        sa.Column('season_id', sa.String(length=36), sa.ForeignKey('seasons.id', ondelete='CASCADE'), nullable=False),
        sa.Column('episode_number', sa.Integer(), nullable=False),
        sa.Column('episode_title', sa.String(length=255), nullable=False),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('language', sa.String(length=10), nullable=False),
        sa.Column('content_group', sa.String(length=100), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_episodes_season_id', 'episodes', ['season_id'])
    op.create_index('ix_episodes_content_group', 'episodes', ['content_group'])
    op.create_index('ix_episodes_cg_lang', 'episodes', ['content_group', 'language'])
    op.create_index('ix_episodes_status', 'episodes', ['status'])

    # 4. Artwork table
    op.create_table(
        'artwork',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('show_id', sa.String(length=36), sa.ForeignKey('shows.id', ondelete='CASCADE'), nullable=True),
        sa.Column('episode_id', sa.String(length=50), sa.ForeignKey('episodes.id', ondelete='CASCADE'), nullable=True),
        sa.Column('artwork_type', sa.String(length=20), nullable=False),
        sa.Column('storage_path', sa.String(length=500), nullable=False),
        sa.Column('url', sa.String(length=500), nullable=False),
        sa.Column('width', sa.Integer(), nullable=False),
        sa.Column('height', sa.Integer(), nullable=False),
        sa.Column('file_size_bytes', sa.Integer(), nullable=False),
        sa.Column('aspect_ratio', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_artwork_show_id', 'artwork', ['show_id'])
    op.create_index('ix_artwork_episode_id', 'artwork', ['episode_id'])
    op.create_index('ix_artwork_show_type', 'artwork', ['show_id', 'artwork_type'])
    op.create_index('ix_artwork_episode_type', 'artwork', ['episode_id', 'artwork_type'])

    # 5. Publish Runs table
    op.create_table(
        'publish_runs',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('triggered_by', sa.String(length=100), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('show_count', sa.Integer(), nullable=False),
        sa.Column('episode_count', sa.Integer(), nullable=False),
        sa.Column('duration_ms', sa.Integer(), nullable=False),
        sa.Column('error_details', sa.Text(), nullable=True),
        sa.Column('catalogue_path', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_publish_runs_created_at', 'publish_runs', ['created_at'])


def downgrade() -> None:
    op.drop_table('publish_runs')
    op.drop_table('artwork')
    op.drop_table('episodes')
    op.drop_table('seasons')
    op.drop_table('shows')
