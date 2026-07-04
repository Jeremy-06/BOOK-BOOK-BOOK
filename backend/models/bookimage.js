module.exports = (sequelize, DataTypes) => {
  const BookImage = sequelize.define(
    "BookImage",
    {
      book_image_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      book_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      image_path: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      is_main: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: "book_image",
      timestamps: true,
      underscored: true,
    },
  );

  return BookImage;
};
