const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

p.demo.findUnique({
  where: { slug: 'jimmys-barber-shop-tyb6ri' },
  include: { services: true }
}).then(demo => {
  if (!demo || demo.services.length === 0) {
    console.log('No demo or services found');
    return;
  }

  const now = new Date();
  const appt1 = new Date(now.getTime() + 30 * 60000);
  const appt2 = new Date(now.getTime() + 90 * 60000);
  const appt3 = new Date(now.getTime() - 60 * 60000);

  return p.booking.createMany({
    data: [
      {
        demoId: demo.id,
        serviceId: demo.services[0].id,
        customerName: 'John Smith',
        customerPhone: '555-123-4567',
        appointmentTime: appt1,
        status: 'confirmed'
      },
      {
        demoId: demo.id,
        serviceId: demo.services[0].id,
        customerName: 'Mike Johnson',
        customerPhone: '555-987-6543',
        appointmentTime: appt2,
        status: 'confirmed'
      },
      {
        demoId: demo.id,
        serviceId: demo.services[0].id,
        customerName: 'Tom Wilson',
        customerPhone: '555-456-7890',
        appointmentTime: appt3,
        status: 'confirmed'
      }
    ]
  }).then(() => console.log('Added 3 test bookings'));
}).finally(() => p.$disconnect());
