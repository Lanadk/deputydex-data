FROM postgres:17-alpine

# Copie des scripts SQL dans le conteneur
COPY src/sql/scripts /sql/scripts

