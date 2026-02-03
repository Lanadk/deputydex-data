export interface IDataExtractor<TExport = any> {
    // Transforme un fichier JSON en ajoutant ses données dans l'extractor
    processFile(filePath: string): void;

    // Récupère la structure exportable finale
    getExport(): TExport;

    // Récupère les erreurs de parsing ou extraction
    getErrors(): Array<{ file: string; error: string }>;
}
