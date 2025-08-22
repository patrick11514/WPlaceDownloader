import Logger from './lib/logger';
//logger for main messages
const l = new Logger('MyCoolApp', 'cyan');

type Cat = {
    name: string;
    age: number;
    color: 'white' | 'orange' | 'black' | 'gray';
};

const myCuteAnimal = {
    name: 'Mourek',
    age: 2,
    color: 'orange'
} satisfies Cat;

l.log(JSON.stringify(myCuteAnimal));
