const Sequelize = require('sequelize');

//the UUID is a type that give unique id and UUIDV4 is a method that will create a unique identifier
const { STRING, UUID, UUIDV4 } = Sequelize;
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db_2') //conn can also be named db
//were going to bring in express and end up bringing JSON data back this is our logging middleware i think
const express = require('express')

const app = express()


//usually when send JSON data back we will prepend our route with api this is more critical in single page applications (remember webpack)
//here setting up our routes so we can view them on web page port 3010
//getting our data, seeding it correctly, getting our data models set up based on the requirements
app.get('/api/departments', async(req, res, next) => {
  try{                          
    res.send(await Department.findAll({
      include: [                              //this is to get to employee data to show remember employee is associated to department using an alias which is manager. use include bring in the employee model and the alias. so the alias does 2 things. it set the foreign key and also sets how this ends up getting loaded and displayed on the web page.  
        {
          model: Employee,
          as: 'manager'
        } 
      ]
    }))
  }
  catch (ex){
    next(ex)
  }
})


//define models
const Department = conn.define('department', {
  name: {
    type: STRING(20),
  }
})

const Employee = conn.define('employee', {
  id: {
    type: UUID,
    primaryKey: true,
    defaultValue: UUIDV4,                  //doing primarykey and default values lines will tive us long unique values for id column
  },

  name: {
    type: STRING(20)                            //the (20) controls the char length
  }

})


//associations

Department.belongsTo(Employee, {as: 'manager'}); // were using aliasing here for the most correct term to use a department belongs to a manager belongs to by deafault tags an id after it so its managerid
Employee.hasMany(Department, { foreignKey: 'managerId' }); //need to put this foreign key otherwise it will create another primary key you will have managerid and employee id. all you want is managerid this is because you used the alias in the previous line


const syncAndSeed = async() => {
  await conn.sync({ force: true }) //wipe out tables wont end up recreating tables without this line
  
  //Promise.all runs things in parallel
  const [moe, lucy, hr, engineering] = await Promise.all([
    Employee.create({ name: 'moe'}),
    Employee.create({name: 'lucy'}),
    Department.create({ name: 'hr'}),
    Department.create({ name: 'engineering'})
  ])

  //in the departments table we are making the manager id match the id of lucy
  hr.managerId = lucy.id; 
  await hr.save()
  //console.log(hr.get())    // .get() method just gets the data
  //console.log(JSON.stringify(hr, null, 2)) //also prints the data and displays as json string 

}

const init = async() => {
  try{
    await conn.authenticate()
    await syncAndSeed()
    const port  = process.env.PORT || 3010; // providing port so we can deploy app
    app.listen(port, ()=> console.log(`listening on port ${port}`))

  }
  catch(ex){
    console.log(ex)
  }
}

init()