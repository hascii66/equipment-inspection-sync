# Equipment Inspector (Offline-First Mobile App)

แอปพลิเคชันมือถือสำหรับบันทึกผลการตรวจสอบอุปกรณ์ (Equipment Inspection) แบบ Offline-first พัฒนาด้วย **Ionic Framework**, **Angular 19+**, **Capacitor** และ **SQLite** ออกแบบมาเพื่อให้เจ้าหน้าที่ภาคสนาม (Field Technicians) สามารถบันทึกข้อมูลการตรวจสอบได้ทันทีแม้ในพื้นที่ที่ไม่มีสัญญาณอินเทอร์เน็ต

---

## 🛠️ ความต้องการของระบบ (System Requirements)
- **Node.js**: เวอร์ชั่น `v20.19` หรือ `v22.12` ขึ้นไป (เนื่องจาก Angular 20 CLI ต้องการ Node เวอร์ชั่นดังกล่าว)
- **nvm** (แนะนำ): เพื่อความสะดวกในการจัดการเวอร์ชั่นของ Node.js

---

## 🚀 ขั้นตอนการติดตั้งและรันโปรเจกต์ (Quick Start)

หากคุณเพิ่งทำการโคลน (Clone) โปรเจกต์นี้มา ให้ทำตามขั้นตอนดังนี้:

### 1. สลับ Node.js เวอร์ชั่น (ถ้ามี nvm)
```bash
nvm use 22
```

### 2. ติดตั้ง Dependencies
ติดตั้งแพ็กเกจทั้งหมดที่จำเป็นของโปรเจกต์:
```bash
npm install
```

### 3. รัน Mock REST API Server (เปิดทิ้งไว้ใน Terminal ที่ 1)
โปรเจกต์นี้ใช้ `json-server` จำลองเป็นระบบ API ส่วนกลางเพื่อรองรับการซิงค์ข้อมูล:
```bash
npm run mock-server
```
*API Server จะทำงานอยู่ที่ [http://localhost:3000/inspections](http://localhost:3000/inspections)*

### 4. รันแอปพลิเคชัน (ใน Terminal ที่ 2)
รัน Angular / Ionic Development Server เพื่อทดสอบบนเว็บเบราว์เซอร์:
```bash
npx ionic serve
```
*ระบบจะเปิดเบราว์เซอร์ไปที่ [http://localhost:8100](http://localhost:8100) อัตโนมัติ*

---

## 💡 ฟีเจอร์ที่พร้อมใช้งาน

1. **Database Initialization & Web Fallback**: 
   - เมื่อเปิดแอปครั้งแรก ระบบจะทำการสร้างตาราง `inspections` และ Seed ข้อมูลอุปกรณ์เริ่มต้น 5 รายการให้ทันที
   - หากรันบนบราวเซอร์ (Web runtime) ระบบจะจำลอง SQLite ผ่าน **LocalStorage** ให้อัตโนมัติ เพื่อให้ผู้ตรวจประเมินสามารถรันเทสบนบราวเซอร์ได้ทันทีโดยไม่ต้องตั้งค่า Native Simulator
2. **Inspection List Screen**:
   - แสดงรายการอุปกรณ์ทั้งหมด พร้อมสถานะการตรวจสอบ (Passed/Failed) และสถานะการซิงค์ที่มีสีระบุชัดเจน (Synced = เขียว, Pending = เหลือง, Failed = แดง)
3. **Inspection Detail Screen**:
   - หน้ารายละเอียดการตรวจสอบ สามารถเลือกเปลี่ยนผลการตรวจสอบเป็น **Passed** หรือ **Failed** และบันทึกลง SQLite/LocalStorage ได้ทันทีในขณะออฟไลน์
4. **Sync Mechanism & Partial Success**:
   - ปุ่ม **Sync** จะกดได้เมื่อตัวแอปตรวจพบสถานะ Online
   - รองรับ **Partial Success**: หากส่งข้อมูลซิงค์ไป 5 ตัว แล้วมีรายการบางตัวซิงค์ล้มเหลว (เช่น Server ขัดข้องเฉพาะเครื่อง) ตัวที่ซิงค์ผ่านจะถูกปรับสถานะเป็น `Synced` ส่วนตัวที่ล้มเหลวจะค้างอยู่ในคิว `Failed` เพื่อรอซิงค์ใหม่ครั้งหน้า
5. **Auto-Trigger Sync**:
   - เมื่อปิดโหมดเครื่องบินหรือเชื่อมต่อเน็ตได้ใหม่อีกครั้ง แอปพลิเคชันจะตรวจสอบคิวและกดซิงค์ข้อมูลให้โดยอัตโนมัติ (ผ่าน Capacitor Network Plugin)

---

## 🏗️ โครงสร้างสถาปัตยกรรม (Architectural Structure)

- **TypeScript Strict Mode**: เปิดใช้งาน Strict Mode ในการประกาศ Interface และ Data Models
- **Separation of Concerns (MVVM Pattern)**:
  - โค้ดของหน้าจอ (`.page.ts`) ไม่มี Business Logic หรือ State ซับซ้อน มีหน้าที่แสดงผลและเรียก Toast / Alerts เท่านั้น
  - Business Logic และการบริหาร State ทั้งหมด ถูกแยกไปอยู่ที่ **ViewModel** (`.viewmodel.ts`)
  - การติดต่อ Database และการทำ Sync ข้อมูล ถูกแยกเป็นระบบ Service (`DatabaseService` และ `SyncService`)
