import fs from 'fs';
import csv from 'csv-parser';
import db from '../db/db.js';

export async function parseAndInsertCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];

    // Lee el CSV subido y acumula las filas
    const stream = fs
      .createReadStream(filePath)
      .pipe(csv({
        separator: ',',
        mapHeaders: ({ header }) => header.trim(),
        mapValues: ({ value }) => (typeof value === 'string' ? value.trim() : value),
      }));

    stream
      .on('data', (row) => {
        
        rows.push(row);
      })
      .on('error', (err) => reject(err))
      .on('end', async () => {
        let inserted = 0;
        let failed = 0;

        try {
          // Inserta cada fila. Manteniendo simpleza y claridad.
          for (const row of rows) {
            
            try {
              const customer = row.customerName || row.customerName || row.PRODUCT || row.customerName || row.customerName;
              const address= row.address || row.address || row.address || row.address;
              const telephone = row.telephone || row.telephone || row.telephone || row.telephone;
              const email = row.email || row.email || row.email || row.email;
              console.log(customer,address,telephone,email);

              if (!customer) {
                failed++;
                continue;
              }
              console.log(customer,address,telephone,email);
              await db.query(
                'INSERT INTO customers ("customerName", address, telephone, email) VALUES ($1, $2, $3, $4)',
                [customer, address, telephone, email]
                
              );
              console.log(customer,address,telephone,email);
              inserted++;
            } catch (errRow) {
              failed++;
            }
          }

          resolve({ total: rows.length, inserted, failed });
          console.log(resolve({ total: rows.length, inserted, failed }))
        } catch (err) {
          reject(err);
        }
      });
  });
}
