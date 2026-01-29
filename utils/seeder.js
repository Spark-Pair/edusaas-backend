const { User, Tenant, Class, Student } = require('../models');

const seedDatabase = async () => {
  try {
    // Check if admin user exists
    const adminExists = await User.findOne({ username: 'admin', role: 'admin' });
    
    if (!adminExists) {
      await User.create({
        username: 'admin',
        password: 'admin123',
        name: 'Super Admin',
        role: 'admin',
        isActive: true
      });
      console.log('✅ Admin user seeded: admin / admin123');
    }

    // Check if demo tenant exists
    const demoTenantUser = await User.findOne({ username: 'demo', role: 'tenant' });
    
    if (!demoTenantUser) {
      const validityDate = new Date();
      validityDate.setMonth(validityDate.getMonth() + 1);

      // Create tenant
      const tenant = await Tenant.create({
        schoolName: 'Demo School',
        status: 'active',
        validityDate
      });

      // Create user for tenant
      await User.create({
        username: 'demo',
        password: 'demo123',
        name: 'Demo School',
        role: 'tenant',
        tenantId: tenant._id,
        isActive: true
      });

      // Create demo classes
      const class1 = await Class.create({
        tenantId: tenant._id,
        name: 'Class 1',
        section: 'A'
      });

      const class2 = await Class.create({
        tenantId: tenant._id,
        name: 'Class 2',
        section: 'A'
      });

      // Create demo students
      await Student.create({
        tenantId: tenant._id,
        classId: class1._id,
        firstName: 'Ali',
        lastName: 'Khan',
        rollNo: '001',
        gender: 'male',
        guardian: 'Ahmed Khan',
        contact: '03001234567',
        status: 'active'
      });

      await Student.create({
        tenantId: tenant._id,
        classId: class1._id,
        firstName: 'Sara',
        lastName: 'Ahmed',
        rollNo: '002',
        gender: 'female',
        guardian: 'Imran Ahmed',
        contact: '03009876543',
        status: 'active'
      });

      await Student.create({
        tenantId: tenant._id,
        classId: class2._id,
        firstName: 'Hassan',
        lastName: 'Ali',
        rollNo: '003',
        gender: 'male',
        guardian: 'Tariq Ali',
        contact: '03007654321',
        status: 'active'
      });

      console.log('✅ Demo tenant seeded: demo / demo123');
    }
  } catch (error) {
    console.error('Seeding error:', error);
  }
};

module.exports = seedDatabase;
