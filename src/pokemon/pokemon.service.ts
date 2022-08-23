import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';

@Injectable()
export class PokemonService {

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>)
  {}

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLowerCase();
    try{
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    }
    catch (error){
      this.handleExeptions(error);
    }    
  }

  findAll( queryParameters: PaginationDto ) {

    const { limit=10, offset=0 } = queryParameters; 

    return this.pokemonModel.find()
            .limit(limit).skip(offset)
            .sort({ no: 1 })
            .select('-__v');
  }

  async findOne(term: string) {
    let pokemon:Pokemon;

    if(!isNaN(+term)){
      pokemon = await this.pokemonModel.findOne({no:term});
    }
    //Mongo Id
    if(!pokemon && isValidObjectId(term)){
      pokemon = await this.pokemonModel.findById(term);
    }
    //Name
    if(!pokemon){
      pokemon = await this.pokemonModel.findOne({name: term.toLowerCase().trim()});
    }

    if(!pokemon) throw new NotFoundException(` Pokemon term: ${term} not found`);

    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    try {
      const pokemon = await this.findOne(term);
      if( updatePokemonDto.name )
        updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
      
      await pokemon.updateOne( updatePokemonDto, {new: true} );

      return { ...pokemon.toJSON(), ...updatePokemonDto };
    }
    catch(error) {
      this.handleExeptions( error );
    }
  }

  async remove(id: string) {
    //const pokemon = await this.findOne(id);
    //await pokemon.deleteOne();
    //const result = await this.pokemonModel.findByIdAndRemove(id);
    const {deletedCount} = await this.pokemonModel.deleteOne({_id: id});
    if(deletedCount === 0 )
      throw new BadRequestException(`Pokemon with id ${id} not found`);
      
    return;

  }

  handleExeptions(error: any){
    if(error.code === 11000)
      throw new BadRequestException(`Pokemon exists un db ${JSON.stringify(error.keyValue)}`);
    console.log(error);
    throw new InternalServerErrorException(`Can´t update Pokemon -  Check server logs`);             
  }
}
