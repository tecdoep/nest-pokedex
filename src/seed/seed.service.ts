import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { PokeResponse } from './interfaces/poke-response.interface';

@Injectable()
export class SeedService {

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    private readonly http: AxiosAdapter,
  )
  {}
  

  async executeSeed() {

    await this.pokemonModel.deleteMany({});

    const data = await this.http.get<PokeResponse>('https://pokeapi.co/api/v2/pokemon?limit=650');


    /*Inserciones por array metodo 1 */
    const pokemonToInsert=[];
    data.results.forEach(  ({ name, url })  =>{
      const segments = url.split('/');
      const no = +segments[segments.length-2];
      pokemonToInsert.push({no,name});    
    });
    
    await this.pokemonModel.insertMany(pokemonToInsert);

    /**Insertar multiples promesas por array 
    const insertPromisesArray=[];

    data.results.forEach(  ({ name, url })  =>{
      const segments = url.split('/');
      const no = +segments[segments.length-2];
      insertPromisesArray.push(this.pokemonModel.create({no,name}));
      //const pokemon= await this.pokemonModel.create({no,name});
    });

    await Promise.all(insertPromisesArray);

    /**Fin de las inserciones por array */
    return 'Seed Executed, successfully!!!';
  }

}
